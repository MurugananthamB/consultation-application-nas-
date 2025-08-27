pipeline {
  agent any
  environment {
    REGISTRY_URL    = 'https://ghcr.io'
    GH_NAMESPACE    = 'murugananthamb'     // github username (lowercase for image path)
    DOCKER_BUILDKIT = '1'
    GIT_CRED_ID     = 'ghcr-cred'          // <-- reuse this for GHCR push + git tag push
    GH_OWNER        = 'MurugananthamB'     // GitHub owner (case as in GitHub)
  }
  options { timestamps() }

  stages {
    stage('Checkout'){ steps { checkout scm } }

    stage('Build & Push') {
      when { anyOf { branch 'main'; branch 'development' } }
      steps {
        script {
          // ---- repo name (raw for GitHub, sanitized for image) ----
          def rawRepo   = sh(returnStdout:true,
                             script:"basename -s .git \$(git config --get remote.origin.url)").trim()
          def imageRepo = rawRepo.toLowerCase()
                                 .replaceAll('[^a-z0-9._-]','')
                                 .replaceAll('^[-._]+|[-._]+$','')
          if (!imageRepo) { error "Invalid repo '${rawRepo}' → cannot derive image name. Set IMAGE_NAME manually." }

          def IMAGE    = "ghcr.io/${GH_NAMESPACE}/${imageRepo}"
          def shortSha = env.GIT_COMMIT.take(7)

          // ---- latest tag → next version ----
          def latestTag = sh(returnStdout:true, script:"git describe --tags --abbrev=0 2>/dev/null || echo v0.0.0").trim()
          def parts     = latestTag.replace('v','').tokenize('.')
          def MAJOR     = (parts.size()>0 ? parts[0].replaceAll('[^0-9].*','') : '0') as int
          def MINOR     = (parts.size()>1 ? parts[1].replaceAll('[^0-9].*','') : '0') as int
          def PATCH     = (parts.size()>2 ? parts[2].replaceAll('[^0-9].*','') : '0') as int
          def NEXT_VERSION = "v${MAJOR}.${MINOR}.${PATCH + 1}"
          def RC_VERSION   = "${NEXT_VERSION}-rc.${env.BUILD_NUMBER}"

          // ---- branch-wise tags ----
          def tags    = (env.BRANCH_NAME == 'main')
                        ? ['prod','latest','main', shortSha, NEXT_VERSION]   // LIVE
                        : ['dev','development', shortSha, RC_VERSION]        // DEV
          def primary = tags[0]

          echo "Building ${IMAGE}:${primary} (git repo: ${rawRepo})"

          withDockerRegistry([url: REGISTRY_URL, credentialsId: env.GIT_CRED_ID]) {
            def img = docker.build("${IMAGE}:${primary}", '.')   // Dockerfile at repo root

            // extra tags
            tags.findAll{ it != primary }.each { t ->
              sh "docker tag ${IMAGE}:${primary} ${IMAGE}:${t}"
            }
            // push all
            tags.each { t -> sh "docker push ${IMAGE}:${t}" }
          }

          // ---- push git tag on MAIN using same credentials ----
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
