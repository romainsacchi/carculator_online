docker login hub.docker.com --username $DOCKER_USER --password-stdin $DOCKER_PASS
if [ "$TRAVIS_BRANCH" = "master" ]; then
TAG="latest"
else
TAG="$TRAVIS_BRANCH"
fi
docker build -f Dockerfile -t $TRAVIS_REPO_SLUG:$TAG .
docker tag $TRAVIS_REPO_SLUG $DOCKER_REPO
docker push $DOCKER_REPO
