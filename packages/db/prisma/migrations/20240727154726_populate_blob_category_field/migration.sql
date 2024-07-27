UPDATE transaction
  SET category = CASE
    WHEN rollup = 'arbitrum'::rollup THEN 'arbitrum'::category 
    WHEN rollup = 'base'::rollup THEN 'base'::category 
    WHEN rollup = 'blast'::rollup THEN 'blast'::category 
    WHEN rollup = 'boba'::rollup THEN 'boba'::category 
    WHEN rollup = 'camp'::rollup THEN 'camp'::category 
    WHEN rollup = 'kroma'::rollup THEN 'kroma'::category 
    WHEN rollup = 'linea'::rollup THEN 'linea'::category 
    WHEN rollup = 'metal'::rollup THEN 'metal'::category 
    WHEN rollup = 'optimism'::rollup THEN 'optimism'::category 
    WHEN rollup = 'optopia'::rollup THEN 'optopia'::category 
    WHEN rollup = 'paradex'::rollup THEN 'paradex'::category 
    WHEN rollup = 'pgn'::rollup THEN 'pgn'::category 
    WHEN rollup = 'scroll'::rollup THEN 'scroll'::category 
    WHEN rollup = 'starknet'::rollup THEN 'starknet'::category 
    WHEN rollup = 'taiko'::rollup THEN 'taiko'::category 
    WHEN rollup = 'zksync'::rollup THEN 'zksync'::category 
    WHEN rollup = 'mode'::rollup THEN 'mode'::category 
    WHEN rollup = 'zora'::rollup THEN 'zora'::category
    ELSE NULL
  END
  WHERE rollup is not null;