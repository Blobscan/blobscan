UPDATE address SET rollup = CASE
  -- Mainnet
  -- New rollups added in 20261103150000_add_blob_list_rollups
  WHEN address = '0xf8ff3e62e94807a5c687f418fe36942dd3a24524' THEN 'adi'::rollup
  WHEN address = '0x7342404ef57e0c2fcf936f7afd9fbf68e44a2fbe' THEN 'aztec'::rollup
  WHEN address = '0xba694234a1896694a07fee45ee4080a5ac70d838' THEN 'aztec'::rollup
  WHEN address = '0xfaf2e4087f1b7e9863adb05392522c1f1d12d4b4' THEN 'aztec'::rollup
  WHEN address = '0xdaa526086787d9debe1d7f3ffdb1fe50cf8687f4' THEN 'robinhood'::rollup
  WHEN address = '0x54dd1659c232dec31386c52507982a4983d9bcb8' THEN 'syndicate'::rollup
  WHEN address = '0x98245d0adf4595c66f0a9db8e13c44cbff6be459' THEN 'xlayer'::rollup
  WHEN address = '0xdfd6c636dcb5a013c2431316c4a0762b84e70a5d' THEN 'xlayer'::rollup

  -- Additional addresses for existing rollups
  WHEN address = '0x6be789605b13edb78749824633b9933d44b582ba' THEN 'abstract'::rollup
  WHEN address = '0x6db6161fc5662450e801398bad62dd9921216b98' THEN 'ink'::rollup
  WHEN address = '0x191ff0ec830f83916a427d169a234c33e48aa79f' THEN 'lighter'::rollup
  WHEN address = '0x5df930bfa5daa2919d8f2a954a4f346a3b2cf8c2' THEN 'pegglecoin'::rollup
  WHEN address = '0x2267c7246523191b8bf7615b86b3bdee612b7d9e' THEN 'taiko'::rollup

  -- Sepolia
  WHEN address = '0x6d77b3f2cfffa24e474afab0d09c1646e87a0a7b' THEN 'robinhood'::rollup

  ELSE rollup
END
WHERE address IN (
  '0xf8ff3e62e94807a5c687f418fe36942dd3a24524',
  '0x7342404ef57e0c2fcf936f7afd9fbf68e44a2fbe',
  '0xba694234a1896694a07fee45ee4080a5ac70d838',
  '0xfaf2e4087f1b7e9863adb05392522c1f1d12d4b4',
  '0xdaa526086787d9debe1d7f3ffdb1fe50cf8687f4',
  '0x54dd1659c232dec31386c52507982a4983d9bcb8',
  '0x98245d0adf4595c66f0a9db8e13c44cbff6be459',
  '0xdfd6c636dcb5a013c2431316c4a0762b84e70a5d',
  '0x6be789605b13edb78749824633b9933d44b582ba',
  '0x6db6161fc5662450e801398bad62dd9921216b98',
  '0x191ff0ec830f83916a427d169a234c33e48aa79f',
  '0x5df930bfa5daa2919d8f2a954a4f346a3b2cf8c2',
  '0x2267c7246523191b8bf7615b86b3bdee612b7d9e',
  '0x6d77b3f2cfffa24e474afab0d09c1646e87a0a7b'
);
