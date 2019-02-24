LAST_COMMIT_MESSAGE="$(git log --no-merges -1 --pretty=%B)"
git config --global user.email "saikatchakrabortty2@gmail.com"
git config --global user.name "Travis CI"
git add --force build/ccxt.browser.js
git commit -a -m "${COMMIT_MESSAGE}" -m '[ci skip]'
git tag -a "${COMMIT_MESSAGE}" -m "${LAST_COMMIT_MESSAGE}" -m "" -m "[ci skip]"
git remote remove origin
git remote add origin https://${GITHUB_TOKEN}@github.com/saikatharryc/pm2-prometheus-exporter.git
git push origin --tags HEAD:master
