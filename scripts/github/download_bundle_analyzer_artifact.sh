# We use this instead of action download-artifact. See discussion on
# https://github.com/dawidd6/action-download-artifact/issues/240
set -xe
ORG="Blobscan"
REPO="blobscan"
WORKFLOW="nextjs-bundle-analysis.yml"
ARTIFACT_NAME="bundle"
DESTINATION="apps/web/.next/analyze/base"
BASE_BRANCH="main"

ARTIFACTS_URL=$(
  gh api \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "/repos/${ORG}/${REPO}/actions/workflows/${WORKFLOW}/runs?event=push&branch=${BASE_BRANCH}&status=success&per_page=1" \
    --jq ".workflow_runs[0].artifacts_url"
)

DOWNLOAD_URL=$(
  gh api \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "${ARTIFACTS_URL}" \
    --jq '.artifacts[] | select(.name == "'"${ARTIFACT_NAME}"'") | .archive_download_url'
)

# Artifacts expire after the retention period, so the latest successful base
# run may no longer have one. Skip the comparison instead of failing.
if [ -z "$DOWNLOAD_URL" ]; then
  echo "::warning::No '${ARTIFACT_NAME}' artifact found for the latest successful ${BASE_BRANCH} run (it may have expired). Skipping bundle comparison."
  exit 0
fi

set +x
curl -H "Accept: application/vnd.github+json" -H "Authorization: token $GH_TOKEN" -L -o "${DESTINATION}.zip" "$DOWNLOAD_URL"
set -x
unzip "${DESTINATION}.zip" -d "${DESTINATION}" && mkdir -p "${DESTINATION}/bundle" && mv "${DESTINATION}/__bundle_analysis.json" "${DESTINATION}/bundle/"
rm "${DESTINATION}.zip"
