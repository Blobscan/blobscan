UPDATE address SET first_block_number_as_receiver = (
  SELECT MIN(block_number)
  FROM transaction
  WHERE to_id = address.address
), first_block_number_as_sender = (
  SELECT MIN(block_number)
  FROM transaction
  WHERE from_id = address.address
) WHERE first_block_number_as_receiver IS NULL OR first_block_number_as_sender IS NULL;
