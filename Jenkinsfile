pipeline {
  agent any
  environment {
    REGISTRY_URL    = 'https://ghcr.io'
    GH_NAMESPACE    = 'murugananthamb'  // github username lowercase
    DOCKER_BUILDKIT = '1'
  }
  options { timestamps() }

  stages {
    stage('Checkout'){ steps { checkout scm } }

    stage('Build & Push') {
      when { anyOf { branch 'main'; branch 'development' } }
      steps {
        script {
          // --- derive repo name (lowercase) & image path ---
          def repo      = sh(returnStdout:true, script:"basename -s .git \$(git config --get remote.origin.url) | tr '[:upper:]' '[:lower:]'").trim()
          def IMAGE     = "ghcr.io/${GH_NAMESPACE}/${repo}"
          def shortSha  = env.GIT_COMMIT.take(7)

          // --- read latest git tag; default v0.0.0 ---
          def latestTag = sh(returnStdout:true, script:"git describe --tags --abbrev=0 2>/dev/null || echo v0.0.0").trim()
          def verParts  = latestTag.replace('v','').tokenize('.')
          def MAJOR = (verParts.size()>0 ? verParts[0].replaceAll('[^0-9].*','') : '0') as int
          def MINOR = (verParts.size()>1 ? verParts[1].replaceAll('[^0-9].*','') : '0') as int
          def PATCH = (verParts.size()>2 ? verParts[2].replaceAll('[^0-9].*','') : '0') as int
          def NEXT_VERSION = "v${MAJOR}.${MINOR}.${PATCH + 1}"            // eg: v1.2.4
          def RC_VERSION   = "${NEXT_VERSION}-rc.${env.BUILD_NUMBER}"     // eg: v1.2.4-rc.37

          // --- branch-wise tags ---
          def tags = (env.BRANCH_NAME == 'main')
                     ? ['prod','latest','main', shortSha, NEXT_VERSION]
                     : ['dev','development', shortSha, RC_VERSION]

          def primary = tags[0]

          withDockerRegistry([url: REGISTRY_URL, credentialsId: 'ghcr-cred']) {
            // build once with primary tag (Dockerfile at repo root)
            def img = docker.build("${IMAGE}:${primary}", '.')

            // add remaining tags
            for (t in tags) {
              if (t != primary) { sh "docker tag ${IMAGE}:${primary} ${IMAGE}:${t}" }
            }

            // push all tags
            for (t in tags) { sh "docker push ${IMAGE}:${t}" }
          }

          // ---- OPTIONAL: push git tag on MAIN (creates release tag in GitHub) ----
          if (env.BRANCH_NAME == 'main') {
            withCredentials([usernamePassword(credentialsId: 'github-repo', usernameVariable: 'GH_USER', passwordVariable: 'GH_PAT')]) {
              sh """
                git config user.email "ci@jenkins"
                git config user.name  "Jenkins CI"
                git tag -a ${NEXT_VERSION} -m "Release ${NEXT_VERSION} from Jenkins"
                git push https://${GH_USER}:${GH_PAT}@github.com/MurugananthamB/${repo}.git ${NEXT_VERSION}
              """
            }
          }
        }
      }
    }

    stage('Skip notice'){
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
