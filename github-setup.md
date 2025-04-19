# Setting up GitHub Repository for LOKQ Token

Follow these steps to create a GitHub repository and push your LOKQ token project:

## 1. Create a new repository on GitHub

1. Go to [GitHub](https://github.com/) and sign in to your account
2. Click the "+" icon in the top right corner and select "New repository"
3. Name your repository (e.g., "lokquidity-token")
4. Add a description: "LOKQ Token - Solana token with locked liquidity and revoked mint authority"
5. Choose "Public" for visibility (since you want to show people the code)
6. Skip adding README, .gitignore, and license (we already have these files)
7. Click "Create repository"

## 2. Link your local repository to GitHub

After creating the repository, you'll see instructions. Run these commands in your terminal:

```bash
# Replace USERNAME with your GitHub username and REPO_NAME with your repository name
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git push -u origin main
```

## 3. Access your token metadata for DEXscreener

Once your repository is on GitHub:

1. Navigate to your `token-metadata.json` file in the GitHub repository
2. Click the "Raw" button to view the raw file
3. Copy the URL of this raw view (should start with `https://raw.githubusercontent.com/`)
4. This is your token metadata URL for DEXscreener compatibility

## 4. Update your token with the metadata URL

Run this command with your new GitHub metadata URL:

```bash
node solana-metadata-update.js YOUR_GITHUB_METADATA_URL
```

## 5. Ongoing updates

To update your repository in the future:

```bash
# After making changes to files
git add .
git commit -m "Description of your changes"
git push origin main
```

Now your entire LOKQ token project is stored on GitHub, easily accessible to share with others!