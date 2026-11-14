// =============================================================================
// Sama Tur - frontend-ci - Jenkinsfile
// Projet Angular dans le sous-dossier sama-tur (site statique servi par Nginx)
// Étapes : npm ci -> tests -> build -> npm audit -> SonarQube -> image -> Trivy -> push -> CD
// =============================================================================

pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 60, unit: 'MINUTES')
    }

    // Polling toutes les 2 minutes (la machine Jenkins n'est pas joignable par GitHub)
    triggers {
        pollSCM('H/2 * * * *')
    }

    // Nom à créer dans : Manage Jenkins > Tools > NodeJS installations (Node 26.13.0)
    tools {
        nodejs 'node26'
    }

    // Premier test : laisser PUSH_AND_DEPLOY décoché (pas de Docker Hub ni de job CD requis)
    parameters {
        booleanParam(name: 'PUSH_AND_DEPLOY', defaultValue: false,
                     description: 'Pousser l\'image sur Docker Hub et déclencher le CD')
    }

    environment {
        // ---- À ADAPTER --------------------------------------------------------
        DOCKERHUB_USER   = 'salioudiop'               // compte Docker Hub, EN MINUSCULES
        IMAGE_REPO       = "${DOCKERHUB_USER}/samatur-frontend"
        APP_DIR          = 'sama-tur'                 // sous-dossier du projet Angular
        SONAR_SERVER     = 'SonarQube'                // Manage Jenkins > System > SonarQube servers
        SONAR_PROJECT    = 'samatur-frontend'
        CD_JOB           = 'deployment-cd'            // nom du job CD
        CD_TAG_PARAM     = 'FRONTEND_TAG'             // paramètre du job CD qui reçoit le tag
        // ---- Credentials Jenkins (IDs) ---------------------------------------
        DOCKERHUB_CREDS  = 'dockerhub-credentials'    // Username + password (token Docker Hub)
        // ----------------------------------------------------------------------
        // Outils lancés via Docker (mêmes commandes que les tests sur poste)
        TRIVY_CMD        = 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v trivy-cache:/root/.cache aquasec/trivy:0.69.3'
        SCANNER_IMAGE    = 'sonarsource/sonar-scanner-cli'
        JENKINS_CONTAINER = 'jenkins'                 // nom du conteneur Jenkins (docker ps)
        REPORTS_DIR      = 'security-reports'         // à la racine du workspace
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                script {
                    def shortSha = sh(script: 'git rev-parse --short=7 HEAD', returnStdout: true).trim()
                    env.IMAGE_TAG = "${env.BUILD_NUMBER}-${shortSha}"
                    echo "Image : ${env.IMAGE_REPO}:${env.IMAGE_TAG}"
                }
                sh 'mkdir -p "$REPORTS_DIR"'
                sh 'node --version && npm --version'
            }
        }

        stage('Installation (npm ci)') {
            steps {
                dir("${env.APP_DIR}") {
                    sh 'npm ci'
                }
            }
        }

        stage('Tests') {
            steps {
                dir("${env.APP_DIR}") {
                    sh 'npm test -- --watch=false'
                }
            }
        }

        stage('Build Angular') {
            steps {
                dir("${env.APP_DIR}") {
                    sh 'npm run build'
                }
            }
        }

        stage('npm audit') {
            steps {
                dir("${env.APP_DIR}") {
                    // Rapports (ne bloquent pas), écrits à la racine du workspace
                    sh '''
                        npm audit --json > "$WORKSPACE/$REPORTS_DIR/npm-audit.json" || true
                        npm audit > "$WORKSPACE/$REPORTS_DIR/npm-audit.txt" 2>&1 || true
                    '''
                    // CRITICAL -> échec du build
                    sh 'npm audit --audit-level=critical'
                    // HIGH -> build instable
                    script {
                        def rc = sh(script: 'npm audit --audit-level=high > /dev/null 2>&1', returnStatus: true)
                        if (rc != 0) {
                            unstable('npm audit : au moins une faille HIGH, voir security-reports/npm-audit.txt')
                        }
                    }
                }
            }
        }

        stage('SonarQube') {
            steps {
                // Le scanner tourne dans un conteneur qui partage les volumes de Jenkins
                // (--volumes-from) : le dossier du projet y est au même chemin.
                withSonarQubeEnv(env.SONAR_SERVER) {
                    sh '''
                        docker run --rm --volumes-from "$JENKINS_CONTAINER" -w "$WORKSPACE" \
                          -e SONAR_HOST_URL="$SONAR_HOST_URL" -e SONAR_TOKEN="$SONAR_AUTH_TOKEN" \
                          "$SCANNER_IMAGE" \
                          -Dsonar.projectKey="$SONAR_PROJECT" \
                          -Dsonar.projectName="$SONAR_PROJECT" \
                          -Dsonar.sources="$APP_DIR/src" \
                          -Dsonar.exclusions="**/*.spec.ts"
                          -Dsonar.working.directory="$WORKSPACE/.scannerwork"
                    '''
                }
            }
        }

        stage('Quality Gate') {
            steps {
                // Nécessite le webhook SonarQube -> http://host.docker.internal:8080/sonarqube-webhook/
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build image Docker') {
            steps {
                // --pull : toujours repartir de la dernière image de base (correctifs de sécurité Alpine)
                // Contexte = sama-tur (Dockerfile de Khakil)
                sh 'docker build --pull -t "$IMAGE_REPO:$IMAGE_TAG" "$APP_DIR"'
            }
        }

        stage('Trivy - scan image') {
            steps {
                // Rapports HIGH + CRITICAL (sortie standard redirigée vers un fichier)
                sh '''
                    $TRIVY_CMD image --timeout 20m --scanners vuln --skip-version-check \
                        --severity HIGH,CRITICAL --format table \
                        "$IMAGE_REPO:$IMAGE_TAG" > "$REPORTS_DIR/trivy-report.txt"
                    $TRIVY_CMD image --timeout 20m --scanners vuln --skip-version-check \
                        --severity HIGH,CRITICAL --format json \
                        "$IMAGE_REPO:$IMAGE_TAG" > "$REPORTS_DIR/trivy-report.json"
                    cat "$REPORTS_DIR/trivy-report.txt"
                '''
                // Porte : échec si CRITICAL avec correctif disponible
                sh '''
                    $TRIVY_CMD image --timeout 20m --scanners vuln --skip-version-check \
                        --severity CRITICAL --ignore-unfixed --exit-code 1 \
                        --no-progress "$IMAGE_REPO:$IMAGE_TAG"
                '''
            }
        }

        stage('Push Docker Hub') {
            when { expression { params.PUSH_AND_DEPLOY } }
            steps {
                withCredentials([usernamePassword(credentialsId: env.DOCKERHUB_CREDS,
                                                  usernameVariable: 'DH_USER',
                                                  passwordVariable: 'DH_PASS')]) {
                    sh '''
                        echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin
                        docker push "$IMAGE_REPO:$IMAGE_TAG"
                        docker tag  "$IMAGE_REPO:$IMAGE_TAG" "$IMAGE_REPO:latest"
                        docker push "$IMAGE_REPO:latest"
                    '''
                }
            }
        }

        stage('Déclenchement du CD') {
            when { expression { params.PUSH_AND_DEPLOY } }
            steps {
                build job: env.CD_JOB,
                      wait: false,
                      parameters: [string(name: env.CD_TAG_PARAM, value: env.IMAGE_TAG)]
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: "${env.REPORTS_DIR}/**", allowEmptyArchive: true
            sh '''
                docker logout || true
                docker rmi "$IMAGE_REPO:$IMAGE_TAG" "$IMAGE_REPO:latest" || true
            '''
        }
        success {
            echo "Frontend ${env.IMAGE_TAG} construit et scanné."
        }
        failure {
            echo "Pipeline en échec : consulter les rapports archivés (${env.REPORTS_DIR})."
        }
    }
}
