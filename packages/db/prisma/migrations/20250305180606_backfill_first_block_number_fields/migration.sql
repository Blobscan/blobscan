UPDATE address SET first_block_number_as_receiver = (
  SELECT first_block_number_as_receiver
  FROM address_category_info
  WHERE address_category_info.address = address.address AND category IS NULL
), first_block_number_as_sender = (
  SELECT first_block_number_as_sender
  FROM address_category_info
  WHERE address_category_info.address = address.address AND category IS NULL
) WHERE first_block_number_as_receiver IS NULL OR first_block_number_as_sender IS NULL;
