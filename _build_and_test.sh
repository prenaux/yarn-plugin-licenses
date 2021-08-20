#!/bin/bash -ex
yarn build
cp "./bundles/@yarnpkg/plugin-licenses.js" "$CW_REPO/.yarn/plugins/@yarnpkg/plugin-licenses.cjs"
cd "$CW_REPO/compilerworks-plugin-webapp-lineage"
mkdir -p "./build/license-checker/dev/"
.gradle/yarn/yarn-latest/bin/yarn licenses generate-disclaimer -R --stdout --outputFile build/license-checker/dev/licenses.txt --outputCsv build/license-checker/dev/licenses.csv --outputDir build/license-checker/dev/
