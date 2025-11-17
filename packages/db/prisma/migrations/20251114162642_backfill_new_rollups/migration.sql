UPDATE address SET rollup = CASE
  -- Mainnet
  -- New rollups added in 20251114155613_add_new_rollups
  WHEN address = '0xb5bd290ef8ef3840cb866c7a8b7cc9e45fde3ab9' THEN 'codex'::rollup
  WHEN address = '0xc076cd93509a0066045f2df8f1e50819a056d2af' THEN 'flynet'::rollup
  WHEN address = '0xba369bd77a346babcd282cb1a015194e8ec54542' THEN 'gravity'::rollup
  WHEN address = '0xa6a19208fe9b7eac1c53adad74f1da5054492de6' THEN 'hpp'::rollup
  WHEN address = '0x1ffda89c755f6d4af069897d77ccabb580fd412a' THEN 'katana'::rollup
  WHEN address = '0xdac936134633c309ba831239e5e25cfe5094b229' THEN 'lachain'::rollup
  WHEN address = '0xfbc0dcd6c3518cb529bc1b585db992a7d40005fa' THEN 'lighter'::rollup
  WHEN address = '0x705623d3985cf88e5a69fc99ca7d089063449902' THEN 'pegglecoin'::rollup
  WHEN address = '0x85e967470c0dcf953438c72f79f9ea2b1b6db079' THEN 'pegglecoin'::rollup
  WHEN address = '0x4cfaa5f421714eae1645dd3276a89b15c9bcf70c' THEN 'pegglecoin'::rollup
  WHEN address = '0x934653ec7c396f16069d6cdac0960e699af14b3d' THEN 'plume'::rollup
  WHEN address = '0x7c93935e2b12cf8eb2687ae736ee8d2a8dfc2bbe' THEN 'powerloom'::rollup
  WHEN address = '0xd0b4c3ac8a50b6f1b3949adaf55cc9805620eb57' THEN 'settlus'::rollup
  WHEN address = '0x8b5606469e21c75edd7c74d1c7a65824675d9aff' THEN 'spire'::rollup
  WHEN address = '0xbe7f4edb6257b4d2c77293c380f19ce96a4fa41e' THEN 'symbiosis'::rollup

  -- Additional addresses for existing rollups
  WHEN address = '0x4b2d036d2c27192549ad5a2f2d9875e1843833de' THEN 'abstract'::rollup
  WHEN address = '0xa4ed58737fc5c4861c33410c29ecb1e2af29d960' THEN 'boba'::rollup
  WHEN address = '0x7cb1022d30b9860c36b243e7b181a1d46f618c69' THEN 'bob'::rollup
  WHEN address = '0x7a2e00b3528f454125ae2913af9ded6492c443f1' THEN 'debankchain'::rollup
  WHEN address = '0xf09ebb62b5ba0cf402b77aba61691cbcf005206f' THEN 'hashkey'::rollup
  WHEN address = '0x9c3df126f6ee3f7077de31fdd81b3ffcc35a675e' THEN 'hemi'::rollup
  WHEN address = '0x284c6a55449eb370f8d63414f0a062b5f13405d2' THEN 'hemi'::rollup
  WHEN address = '0x2f40d796917ffb642bd2e2bdd2c762a5e40fd749' THEN 'mantle'::rollup
  WHEN address = '0xae4d46bd9117cb017c5185844699c51107cb28a9' THEN 'metis'::rollup
  WHEN address = '0xeb18ea5dedee42e7af378991dfeb719d21c17b4c' THEN 'swellchain'::rollup
  WHEN address = '0x41f2f55571f9e8e3ba511adc48879bd67626a2b6' THEN 'taiko'::rollup
  WHEN address = '0x5f62d006c10c009ff50c878cd6157ac861c99990' THEN 'taiko'::rollup
  WHEN address = '0x7a853a6480f4d7db79ae91c16c960dbbb6710d25' THEN 'taiko'::rollup
  WHEN address = '0xcbeb5d484b54498d3893a0c3eb790331962e9e9d' THEN 'taiko'::rollup
  WHEN address = '0x2c89dc1b6eca603adace60a76d3074f3835f6cbe' THEN 'taiko'::rollup
  WHEN address = '0xe2da8ac2e550cd141198a117520d4edc8692ab74' THEN 'taiko'::rollup
  WHEN address = '0x000cb000e880a92a8f383d69da2142a969b93de7' THEN 'taiko'::rollup
  WHEN address = '0xe1d8d4c8656949764c2c9fa9fab2c15d3f42e6c2' THEN 'zksync'::rollup

  ELSE rollup
END
WHERE address IN (
  '0xb5bd290ef8ef3840cb866c7a8b7cc9e45fde3ab9',
  '0x14e4e97bdc195d399ad8e7fc14451c279fe04c8e',
  '0xc076cd93509a0066045f2df8f1e50819a056d2af',
  '0xe5cf545d399b2a47ef1f9b7619fb92e270220f8a',
  '0xba369bd77a346babcd282cb1a015194e8ec54542',
  '0xa6a19208fe9b7eac1c53adad74f1da5054492de6',
  '0x1ffda89c755f6d4af069897d77ccabb580fd412a',
  '0xdac936134633c309ba831239e5e25cfe5094b229',
  '0xfbc0dcd6c3518cb529bc1b585db992a7d40005fa',
  '0x705623d3985cf88e5a69fc99ca7d089063449902',
  '0x85e967470c0dcf953438c72f79f9ea2b1b6db079',
  '0x4cfaa5f421714eae1645dd3276a89b15c9bcf70c',
  '0x934653ec7c396f16069d6cdac0960e699af14b3d',
  '0x7c93935e2b12cf8eb2687ae736ee8d2a8dfc2bbe',
  '0xd0b4c3ac8a50b6f1b3949adaf55cc9805620eb57',
  '0x8b5606469e21c75edd7c74d1c7a65824675d9aff',
  '0x583e2c664c868611a6e3f1d6dcbc8aa00de43a7f',
  '0xbe7f4edb6257b4d2c77293c380f19ce96a4fa41e',
  '0x4b2d036d2c27192549ad5a2f2d9875e1843833de',
  '0xa4ed58737fc5c4861c33410c29ecb1e2af29d960',
  '0x7cb1022d30b9860c36b243e7b181a1d46f618c69',
  '0x7a2e00b3528f454125ae2913af9ded6492c443f1',
  '0xf09ebb62b5ba0cf402b77aba61691cbcf005206f',
  '0x9c3df126f6ee3f7077de31fdd81b3ffcc35a675e',
  '0x284c6a55449eb370f8d63414f0a062b5f13405d2',
  '0x2f40d796917ffb642bd2e2bdd2c762a5e40fd749',
  '0xae4d46bd9117cb017c5185844699c51107cb28a9',
  '0xeb18ea5dedee42e7af378991dfeb719d21c17b4c',
  '0x41f2f55571f9e8e3ba511adc48879bd67626a2b6',
  '0x5f62d006c10c009ff50c878cd6157ac861c99990',
  '0x7a853a6480f4d7db79ae91c16c960dbbb6710d25',
  '0xcbeb5d484b54498d3893a0c3eb790331962e9e9d',
  '0x2c89dc1b6eca603adace60a76d3074f3835f6cbe',
  '0xe2da8ac2e550cd141198a117520d4edc8692ab74',
  '0x000cb000e880a92a8f383d69da2142a969b93de7',
  '0xe1d8d4c8656949764c2c9fa9fab2c15d3f42e6c2'
);
