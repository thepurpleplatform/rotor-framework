# Self-Hosted GitHub Actions Runner Setup

This document explains how to set up a self-hosted GitHub Actions runner for the Rotor Framework project. A self-hosted runner is required because the CI/CD pipeline needs to deploy and test on a physical Roku device connected to your local network.

## Why Self-Hosted?

GitHub's hosted runners cannot access devices on your local network. Since our test suite uses Rooibos with coverage collection on a real Roku device, we need a runner that:
- Has network access to your Roku device
- Can execute `collect-coverage.js` script which deploys to the device
- Can connect to the Roku debug console (port 8085)

## Prerequisites

- A Mac/Linux/Windows machine that will run the GitHub Actions runner
- The machine must be on the same network as your Roku device
- Roku device in developer mode with known IP address and developer password
- GitHub repository admin access

## Setup Steps

### 1. Install GitHub Actions Runner

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Actions** → **Runners**
3. Click **New self-hosted runner**
4. Select your operating system (macOS/Linux/Windows)
5. Follow the installation commands shown on the page:

```bash
# Example for macOS (commands will be specific to your repo)
mkdir actions-runner && cd actions-runner
curl -o actions-runner-osx-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-osx-x64-2.311.0.tar.gz
tar xzf ./actions-runner-osx-x64-2.311.0.tar.gz
./config.sh --url https://github.com/thepurpleplatform/rotor-framework --token YOUR_TOKEN
./run.sh
```

### 2. Configure Runner as a Service (Optional but Recommended)

To run the runner as a background service:

**macOS/Linux:**
```bash
sudo ./svc.sh install
sudo ./svc.sh start
```

**Windows:**
```powershell
./svc.sh install
./svc.sh start
```

### 3. Configure Repository Secrets

Add the following secrets to your GitHub repository (**Settings** → **Secrets and variables** → **Actions** → **New repository secret**):

- `ROKU_DEV_TARGET`: Your Roku device IP address (e.g., `192.168.1.100`)
- `ROKU_DEV_PASS`: Your Roku developer password

These secrets are used by the `collect-coverage.js` script during the test phase.

### 4. Configure Coveralls

1. Go to [coveralls.io](https://coveralls.io)
2. Sign in with your GitHub account
3. Add your repository: **Add repos** → find `thepurpleplatform/rotor-framework` → toggle ON
4. No additional secrets needed - the workflow uses `GITHUB_TOKEN` automatically

### 5. Verify Setup

Create a test tag to trigger the workflow:

```bash
git tag v0.0.1-test
git push origin v0.0.1-test
```

Monitor the workflow run:
- Go to **Actions** tab in your GitHub repository
- You should see "Build, Test & Publish" workflow running
- Check that it runs on your self-hosted runner
- Verify all steps complete successfully

## Local Environment File

Your self-hosted runner machine should have a `.env` file in the project root with:

```bash
ROKU_DEV_TARGET=192.168.1.100
ROKU_DEV_PASS=your_password_here
```

Note: The GitHub Actions workflow will override these values with the secrets configured in step 3.

## Troubleshooting

### Runner Not Picking Up Jobs
- Ensure the runner is online: check **Settings** → **Actions** → **Runners**
- Restart the runner service: `sudo ./svc.sh restart` (macOS/Linux)
- Check runner logs: `./run.sh` (run in foreground to see output)

### Build Fails to Connect to Roku
- Verify `ROKU_DEV_TARGET` and `ROKU_DEV_PASS` secrets are set correctly
- Ensure the runner machine and Roku are on the same network
- Test manually: `npm run collect-coverage` from the runner machine

### Coverage Upload Fails
- Ensure repository is added on coveralls.io
- Check that `coverage.lcov` file was generated in the workspace
- Verify the workflow has the correct repo path in the badge URL

### Tests Timeout
- Default timeout is 5 minutes (300000ms) in `collect-coverage.js`
- If tests take longer, increase timeout value in the script
- Check Roku device console for any crashes or hanging tests

## Security Notes

- The self-hosted runner executes untrusted code from pull requests by default
- Consider using a dedicated machine or VM for the runner
- Never expose your `.env` file or runner credentials
- The `GITHUB_TOKEN` secret is automatically provided and scoped to the repository

## Publishing Releases

Once the runner is configured, publish new versions by creating tags:

```bash
# Update version in package.json
npm version patch  # or minor, or major

# Push tag to trigger workflow
git push origin main --follow-tags
```

The workflow will:
1. Build the project
2. Run lint checks
3. Deploy to Roku and run tests with coverage
4. Upload coverage to Coveralls
5. Publish to GitHub Packages

## Resources

- [GitHub Actions Self-hosted Runners Documentation](https://docs.github.com/en/actions/hosting-your-own-runners)
- [Coveralls Documentation](https://docs.coveralls.io/)
- [GitHub Packages Documentation](https://docs.github.com/en/packages)
