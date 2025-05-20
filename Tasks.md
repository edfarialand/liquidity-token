# Tasks to Launch "Paragon Pool" Token

This file lists the updates required to transform the current LOKQ-focused repository into a proper template for launching a new token ("Paragon Pool") using Solana's Token‑2022 program. The steps reference details from `AI_Explanation.txt` and the `SOLOTTO_WORKING_EXAMPLE` folder.

## 1. Project Configuration

1. **Edit `MySolanaProjectConfg.json`**
   - Set `tokenName` to `"Paragon Pool"`.
   - Choose and set a `tokenSymbol` (e.g. `"PARA"`).
   - Ensure `tokenDecimals` and `tokenSupply` have your desired values.
   - Point `payerKeyPath` to the wallet that will pay for creation.
   - Leave `tokenAddress` and `metadataPDA` empty until after the mint is created.
   - Later, update `jsonMetadataUri` with a permanent link to the uploaded metadata JSON.

2. **Prepare Token Metadata**
   - Create a new metadata file (example `paragon-pool-metadata.json`) based on `solana-token.js`.
   - Replace name, symbol, description and image fields with Paragon Pool information.
   - Upload the logo image to Arweave or IPFS (e.g. NFT.Storage) and update the metadata file with this URI.
   - Upload the completed metadata JSON as well and note its URI for the config file.

## 2. Token Creation Script

3. **Modify `solana-token-create.js` to use Token‑2022**
   - Import `TOKEN_2022_PROGRAM_ID` from `@solana/spl-token`.
   - Replace `TOKEN_PROGRAM_ID` references (in `createAccount`, `initializeMintInstruction`, etc.) with `TOKEN_2022_PROGRAM_ID`.
   - When calling `createSetAuthorityInstruction` specify `TOKEN_2022_PROGRAM_ID` so the mint authority is revoked on the Token‑2022 program.
   - Keep `MINT_SIZE` unless future extensions require a larger mint account.
   - The script should still create the mint, metadata PDA and associated token account, then mint the entire supply and revoke mint authority.

4. **Update Console Messages and README References**
   - Ensure the README and package.json scripts reference `solana-token-create.js` as the main creation script (the current default points to `solana-token.js`).
   - Mention that the script connects to `mainnet-beta` by default; provide instructions to change the cluster if needed.

## 3. Metadata Update Script

5. **Adjust `solana-metadata-update.js`**
   - Make sure it loads `MySolanaProjectConfg.json` instead of the old `project-token-config.json` name.
   - Read token name and symbol from the config or metadata JSON so they match Paragon Pool.
   - Optionally allow leaving `isMutable` true if you want future updates.
   - After running this script, update `tokenAddress` and `metadataPDA` in the config.

## 4. Upload Helpers (Missing Scripts)

6. **Implement upload scripts mentioned in the README**
   - Create `nft-storage-upload.js` and `arweave-upload.js` (or a single `upload-one-command.sh`) that:
     1. Reads your metadata and image files.
     2. Uploads them to the chosen service.
     3. Returns the permanent URLs.
   - Update documentation to show how to use these scripts before running the creation script.

## 5. Liquidity and Token Distribution

7. **Add liquidity‑locking procedures**
   - Provide a script or manual instructions for adding initial liquidity to a DEX (e.g. Orca or Raydium) and locking the LP tokens.
   - Document how many tokens and SOL (or USDC) to add, and where the locked LP tokens will reside.

8. **Token distribution example**
   - Include a script or guideline on how to distribute tokens to early holders or for airdrops (refer to `SOLOTTO_WORKING_EXAMPLE/distribute_to_csv.sh`).

## 6. Additional Requirements & Housekeeping

9. **Security and Key Management**
   - Emphasize keeping the keypair in `payerKeyPath` secure. Do not commit it to version control.
   - Add `.gitignore` rules if necessary so no private keys or generated files are tracked.

10. **Documentation Updates**
    - Rewrite the README to reflect Paragon Pool rather than LOKQ, including instructions from this tasks list.
    - Document the full workflow: upload metadata, run creation script, update configuration, optionally finalize metadata, and lock liquidity.

11. **Testing and Validation**
    - Provide step‑by‑step instructions or scripts to verify the token on Solana explorers and in wallets.
    - Consider adding automated tests (e.g. small Node scripts) to check that metadata and supply match expectations.

12. **Future Enhancements**
    - If features such as transfer fees or lotteries (as seen in the Solotto example) are desired, outline them as future phases.
    - Keep the configuration flexible so these features can be added later using Token‑2022 extensions or on-chain programs.

Following the above steps will turn the current repository into a solid foundation for launching Paragon Pool or any future Token‑2022 based project.
