-- Migrate data from the address table to the address_history table
INSERT INTO address_history (
  address,
  category,
  first_block_number_as_receiver,
  first_block_number_as_sender
)
SELECT
  address,
  'other'::category AS category,
  first_block_number_as_receiver,
  first_block_number_as_sender
FROM address;

-- Update the `category` field for addresses that are associated with rollup transactions
UPDATE address_history
SET category = 'rollup'::category
WHERE address IN (
-- Mainnet
'0xc1b634853cb333d3ad8663715b08f41a3aec47cc',
'0x5050f69a9786f081509234f1a7f4684b5e5b76c9',
'0x415c8893d514f9bc5211d36eeda4183226b84aa7',
'0xe1b64045351b0b6e9821f19b39f81bc4711d2230',
'0x08f9f14ff43e112b18c96f0986f28cb1878f1d11',
'0x41b8cd6791de4d8f9e0eaf7861ac506822adce12',
'0xa9268341831efa4937537bc3e9eb36dbece83c7e',
'0xc94c243f8fb37223f3eb2f7961f7072602a51b8b',
'0x6887246668a3b87f54deb3b94ba47a6f63f32985',
'0x3d0bf26e60a689a7da5ea3ddad7371f27f7671a5',
'0xc70ae19b5feaa5c19f576e621d2bad9771864fe2',
'0x5ead389b57d533a94a0eacd570dc1cc59c25f2d4',
'0xcf2898225ed05be911d3709d9417e86e0b4cfc8f',
'0x2c169dfe5fbba12957bdd0ba47d9cedbfe260ca7',
'0x000000633b68f5d8d3a86593ebb815b4663bcbe0',
'0x0d3250c3d5facb74ac15834096397a3ef790ec99',
'0x99199a22125034c808ff20f377d91187e8050f2e',
'0x625726c858dbf78c0125436c943bf4b4be9d9033',
-- Sepolia
'0xb2248390842d3c4acf1d8a893954afc0eac586e5',
'0x6cdebe940bc0f26850285caca097c11c33103e47',
'0xf15dc770221b99c98d4aaed568f2ab04b9d16e42',
'0x47c63d1e391fcb3dcdc40c4d7fa58adb172f8c38',
'0x8f23bb38f531600e5d8fddaaec41f13fab46e98c',
'0x2d567ece699eabe5afcd141edb7a4f2d0d6ce8a0',
'0x5b98b836969a60fec50fa925905dd1d382a7db43',
'0x4e6bd53883107b063c502ddd49f9600dc51b3ddc',
'0x3cd868e221a3be64b161d596a7482257a99d857f'
);