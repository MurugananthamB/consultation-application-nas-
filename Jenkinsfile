pipeline {
  agent any
  environment {
    REGISTRY_URL    = 'https://ghcr.io'
    GH_NAMESPACE    = 'murugananthamb'   // github username (lowercase for image path)
    GH_OWNER        = 'MurugananthamB'   // GitHub owner (as in GitHub)
    DOCKER_BUILDKIT = '1'
    GIT_CRED_ID     = 'ghcr-cred'        // same cred for GHCR + optional git tag push
  }
  options { timestamps() }

  stages {
    stage('Checkout') { steps { checkout scm } }

    stage('Build & Push') {
      when { anyOf { branch 'main'; branch 'development' } }
      steps {
        script {
          // ---- repo name (raw for GitHub, sanitized for image) ----
          def rawRepo   = sh(returnStdout: true,
                             script: "basename -s .git \$(git config --get remote.origin.url)").trim()
          def imageRepo = rawRepo.toLowerCase()
                                 .replaceAll('[^a-z0-9._-]','')
                                 .replaceAll('^[-._]+|[-._]+$','')
          if (!imageRepo) { error "Invalid repo '${rawRepo}' → cannot derive image name." }

          def IMAGE     = "ghcr.io/${GH_NAMESPACE}/${imageRepo}"
          def shortSha  = env.GIT_COMMIT.take(7)
          def buildNo   = env.BUILD_NUMBER

          // ---- latest tag (or default) → next version ----
          def latestTag = sh(returnStdout:true, script: "git describe --tags --abbrev=0 2>/dev/null || echo v0.0.0").trim()
          def parts     = latestTag.replace('v','').tokenize('.')
          def MAJOR     = (parts.size()>0 ? parts[0].replaceAll('[^0-9].*','') : '0') as int
          def MINOR     = (parts.size()>1 ? parts[1].replaceAll('[^0-9].*','') : '0') as int
          def PATCH     = (parts.size()>2 ? parts[2].replaceAll('[^0-9].*','') : '0') as int
          def NEXT_VERSION = "v${MAJOR}.${MINOR}.${PATCH + 1}"
          def RC_VERSION   = "${NEXT_VERSION}-rc.${buildNo}"

          // ---- Simpler tags (no duplicates) ----
          // main  => prod, latest, vX.Y.Z, <sha>
          // dev   => dev,  vX.Y.Z-rc.N,   <sha>
          def tags    = (env.BRANCH_NAME == 'main')
                        ? ['prod','latest', NEXT_VERSION, shortSha]
                        : ['dev', RC_VERSION, shortSha]
          def primary = tags[0]

          echo "Building ${IMAGE}:${primary} (repo: ${rawRepo}, branch: ${env.BRANCH_NAME})"

          withDockerRegistry([url: REGISTRY_URL, credentialsId: env.GIT_CRED_ID]) {

            // ---- Build with LABELs/ARGS (digest mismatch guarantee)
            def buildArgs = """
              --label ci.branch=${env.BRANCH_NAME} \
              --label ci.sha=${env.GIT_COMMIT} \
              --label ci.build=${buildNo} \
              --label ci.repo=${rawRepo} \
              --label ci.version=${(env.BRANCH_NAME=='main') ? NEXT_VERSION : RC_VERSION} \
              .
            """.trim()

            def img = docker.build("${IMAGE}:${primary}", buildArgs)

            // add extra tags
            tags.findAll{ it != primary }.each { t ->
              sh "docker tag ${IMAGE}:${primary} ${IMAGE}:${t}"
            }

            // push all tags
            tags.each { t -> sh "docker push ${IMAGE}:${t}" }
          }

          // ---- OPTIONAL: push Git tag for MAIN ---
          if (env.BRANCH_NAME == 'main') {
            withCredentials([usernamePassword(credentialsId: env.GIT_CRED_ID,
                                              usernameVariable: 'GH_USER',
                                              passwordVariable: 'GH_PAT')]) {
              sh """
                git config user.email "ci@jenkins"
                git config user.name  "Jenkins CI"
                git tag -a ${NEXT_VERSION} -m "Release ${NEXT_VERSION} from Jenkins"
                git push https://${GH_USER}:${GH_PAT}@github.com/${GH_OWNER}/${rawRepo}.git ${NEXT_VERSION}
              """
            }
          }
        }
      }
    }

    stage('Skip notice') {
      when { not { anyOf { branch 'main'; branch 'development' } } }
      steps { echo "Only main & development build. '${env.BRANCH_NAME}' skipped." }
    }
  }

  post {
    always {
      sh 'docker logout ghcr.io || true'
      sh 'docker image prune -f || true'
    }
  }
}
