#! /bin/bash

VARS=./sitevars.sh # user-supplied vars for SITE, APP, and FOLDER


if [ ! -f "$VARS" ]; then
   echo "You must supply app environment variables in $VARS to deploy"
   exit 2
fi

source "$VARS"

if [ -z "$SITE" ]; then
    echo "no SITE"
    exit 4
fi
if [ -z "$APP" ]; then
    echo "no APP"
    exit 4
fi
if [ -z "$FOLDER" ]; then
    echo "no FOLDER"
    exit 4
fi

README_PATH="./README.md"
VERSION_PATH="./src/version.ts"
version=$(grep -o -m 1 "[0-9][0-9][0-9]" "$VERSION_PATH")
echo "$version"
version_inc=$((version + 1))
echo "$version_inc"
sed -i -e "s/[0-9][0-9][0-9]/$version_inc/g" "$VERSION_PATH"
sed -i -e "s/000[0-9][0-9][0-9]/000$version_inc/g" "$README_PATH"

rm "$VERSION_PATH-e"
rm "$README_PATH-e"


tools=("zip" "scp" "ssh" "npm" "npx" "sed")

for tool in "${tools[@]}"; do
    if ! which "$tool" >/dev/null; then
        echo "$tool" not found
        exit 3
    fi
done

rm -rf dist # Remove old build
rm -rf $APP
rm "$APP.zip"


bun run build

# rename output folder
mv dist "$APP"



# compress output
zip -vr "$APP".zip "$APP"

# copy zip to site
scp "$APP".zip "$SITE":public_html

# unzip zip at site, exit
export SHELL_COMMAND="cd public_html; rm -rf $APP;  unzip $APP.zip; rm $APP.zip; exit; bash"
echo "$SHELL_COMMAND"
ssh -t "$SITE" "$SHELL_COMMAND"
cd ../..

