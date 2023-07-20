-- AddForeignKey
ALTER TABLE "BlobsOnTransactions" ADD CONSTRAINT "BlobsOnTransactions_blobHash_fkey" FOREIGN KEY ("blobHash") REFERENCES "Blob"("versionedHash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlobsOnTransactions" ADD CONSTRAINT "BlobsOnTransactions_txHash_fkey" FOREIGN KEY ("txHash") REFERENCES "Transaction"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;
