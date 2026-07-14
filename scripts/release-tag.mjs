// Shared release-tag contract for nori-discord-cli.
//
// A stable git tag drives the publish workflow
// (.github/workflows/discord-cli-release.yml). A tag is the release version prefixed with
// `discord-cli-v`, matching the sibling nori-slack-cli / nori-skillsets conventions.

export const TAG_PREFIX = "discord-cli-v";

// Stable X.Y.Z only. Kept in sync with the version validation in the workflow.
const STABLE_SEMVER = /^[0-9]+\.[0-9]+\.[0-9]+$/;

export function releaseTagFor(version) {
  if (version === "0.0.0") {
    throw new Error(
      `Invalid version "${version}": 0.0.0 is the package.json placeholder, not a release version`
    );
  }
  if (!STABLE_SEMVER.test(version)) {
    throw new Error(
      `Invalid version "${version}": expected a stable semver like 1.2.3`
    );
  }
  return `${TAG_PREFIX}${version}`;
}
