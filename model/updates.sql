
-- larger number value updates 



-- Update Client table
ALTER TABLE Client
  ALTER COLUMN TotalPayout TYPE DECIMAL(15, 2),
  ALTER COLUMN TotalVolume TYPE DECIMAL(15, 2);


-- Update AutoClientTotals table
ALTER TABLE AutoClientTotals
  ALTER COLUMN TotalDrumsRotors TYPE DECIMAL(15, 2),
  ALTER COLUMN TotalShortIron TYPE DECIMAL(15, 2),
  ALTER COLUMN TotalShredSteel TYPE DECIMAL(15, 2),
  ALTER COLUMN TotalAluminumBreakage TYPE DECIMAL(15, 2),
  ALTER COLUMN TotalDirtyAluminumRadiators TYPE DECIMAL(15, 2),
  ALTER COLUMN TotalWiringHarness TYPE DECIMAL(15, 2),
  ALTER COLUMN TotalACCompressor TYPE DECIMAL(15, 2),
  ALTER COLUMN TotalAlternatorStarter TYPE DECIMAL(15, 2),
  ALTER COLUMN TotalAluminumRims TYPE DECIMAL(15, 2),
  ALTER COLUMN TotalChromeRims TYPE DECIMAL(15, 2),
  ALTER COLUMN TotalBrassCopperRadiator TYPE DECIMAL(15, 2),
  ALTER COLUMN TotalPayout TYPE DECIMAL(15, 2);

-- Update HVACClientTotals table
ALTER TABLE HVACClientTotals
  ALTER COLUMN TotalShredSteel TYPE DECIMAL(15, 2),
  ALTER COLUMN TotalDirtyAlumCopperRadiators TYPE DECIMAL(15, 2),
  ALTER COLUMN TotalCleanAluminumRadiators TYPE DECIMAL(15, 2),
  ALTER COLUMN TotalCopperTwo TYPE DECIMAL(15, 2),
  ALTER COLUMN TotalCompressors TYPE DECIMAL(15, 2),
  ALTER COLUMN TotalDirtyBrass TYPE DECIMAL(15, 2),
  ALTER COLUMN TotalElectricMotors TYPE DECIMAL(15, 2),
  ALTER COLUMN TotalAluminumBreakage TYPE DECIMAL(15, 2),
  ALTER COLUMN TotalPayout TYPE DECIMAL(15, 2);

-- Update InsulationClientTotals table
ALTER TABLE InsulationClientTotals
  ALTER COLUMN TotalDumpFees TYPE DECIMAL(15, 2),
  ALTER COLUMN TotalHaulFees TYPE DECIMAL(15, 2);







-- NOT NULL updates 

-- Update NULL values in Client table
UPDATE Client SET TotalPayout = 0 WHERE TotalPayout IS NULL;
UPDATE Client SET TotalVolume = 0 WHERE TotalVolume IS NULL;
UPDATE Client SET PaymentMethod = 'Cash' WHERE PaymentMethod IS NULL;
UPDATE Client SET LastPickupDate = CURRENT_DATE WHERE LastPickupDate IS NULL;

-- Add NOT NULL constraints to Client table
ALTER TABLE Client 
  ALTER COLUMN AvgTimeBetweenPickups SET NOT NULL,
  ALTER COLUMN TotalPayout SET NOT NULL,
  ALTER COLUMN TotalVolume SET NOT NULL,
  ALTER COLUMN PaymentMethod SET NOT NULL,
  ALTER COLUMN LastPickupDate SET NOT NULL;

-- Update NULL values in Receipt table
UPDATE Receipt SET PaymentMethod = 'Cash' WHERE PaymentMethod IS NULL;
UPDATE Receipt SET TotalVolume = 0 WHERE TotalVolume IS NULL;
UPDATE Receipt SET TotalPayout = 0 WHERE TotalPayout IS NULL;

-- Add NOT NULL constraints to Receipt table
ALTER TABLE Receipt
  ALTER COLUMN PaymentMethod SET NOT NULL,
  ALTER COLUMN TotalVolume SET NOT NULL,
  ALTER COLUMN TotalPayout SET NOT NULL;

-- Handle AutoClientTotals table
UPDATE AutoClientTotals SET
  TotalDrumsRotors = COALESCE(TotalDrumsRotors, 0),
  TotalShortIron = COALESCE(TotalShortIron, 0),
  TotalShredSteel = COALESCE(TotalShredSteel, 0),
  TotalAluminumBreakage = COALESCE(TotalAluminumBreakage, 0),
  TotalDirtyAluminumRadiators = COALESCE(TotalDirtyAluminumRadiators, 0),
  TotalWiringHarness = COALESCE(TotalWiringHarness, 0),
  TotalACCompressor = COALESCE(TotalACCompressor, 0),
  TotalAlternatorStarter = COALESCE(TotalAlternatorStarter, 0),
  TotalAluminumRims = COALESCE(TotalAluminumRims, 0),
  TotalChromeRims = COALESCE(TotalChromeRims, 0),
  TotalBrassCopperRadiator = COALESCE(TotalBrassCopperRadiator, 0),
  TotalPayout = COALESCE(TotalPayout, 0);

ALTER TABLE AutoClientTotals
  ALTER COLUMN TotalDrumsRotors SET NOT NULL,
  ALTER COLUMN TotalShortIron SET NOT NULL,
  ALTER COLUMN TotalShredSteel SET NOT NULL,
  ALTER COLUMN TotalAluminumBreakage SET NOT NULL,
  ALTER COLUMN TotalDirtyAluminumRadiators SET NOT NULL,
  ALTER COLUMN TotalWiringHarness SET NOT NULL,
  ALTER COLUMN TotalACCompressor SET NOT NULL,
  ALTER COLUMN TotalAlternatorStarter SET NOT NULL,
  ALTER COLUMN TotalAluminumRims SET NOT NULL,
  ALTER COLUMN TotalChromeRims SET NOT NULL,
  ALTER COLUMN TotalBrassCopperRadiator SET NOT NULL,
  ALTER COLUMN TotalPayout SET NOT NULL;

-- Handle HVACClientTotals table
UPDATE HVACClientTotals SET
  TotalShredSteel = COALESCE(TotalShredSteel, 0),
  TotalDirtyAlumCopperRadiators = COALESCE(TotalDirtyAlumCopperRadiators, 0),
  TotalCleanAluminumRadiators = COALESCE(TotalCleanAluminumRadiators, 0),
  TotalCopperTwo = COALESCE(TotalCopperTwo, 0),
  TotalCompressors = COALESCE(TotalCompressors, 0),
  TotalDirtyBrass = COALESCE(TotalDirtyBrass, 0),
  TotalElectricMotors = COALESCE(TotalElectricMotors, 0),
  TotalAluminumBreakage = COALESCE(TotalAluminumBreakage, 0),
  TotalPayout = COALESCE(TotalPayout, 0);

ALTER TABLE HVACClientTotals
  ALTER COLUMN TotalShredSteel SET NOT NULL,
  ALTER COLUMN TotalDirtyAlumCopperRadiators SET NOT NULL,
  ALTER COLUMN TotalCleanAluminumRadiators SET NOT NULL,
  ALTER COLUMN TotalCopperTwo SET NOT NULL,
  ALTER COLUMN TotalCompressors SET NOT NULL,
  ALTER COLUMN TotalDirtyBrass SET NOT NULL,
  ALTER COLUMN TotalElectricMotors SET NOT NULL,
  ALTER COLUMN TotalAluminumBreakage SET NOT NULL,
  ALTER COLUMN TotalPayout SET NOT NULL;

-- Handle InsulationClientTotals table
UPDATE InsulationClientTotals SET
  TotalDumpFees = COALESCE(TotalDumpFees, 0),
  TotalHaulFees = COALESCE(TotalHaulFees, 0);

ALTER TABLE InsulationClientTotals
  ALTER COLUMN TotalDumpFees SET NOT NULL,
  ALTER COLUMN TotalHaulFees SET NOT NULL;

-- Handle AutoReceiptMetals table
UPDATE AutoReceiptMetals SET
  DrumsRotorsWeight = COALESCE(DrumsRotorsWeight, 0),
  DrumsRotorsPrice = COALESCE(DrumsRotorsPrice, 0),
  ShortIronWeight = COALESCE(ShortIronWeight, 0),
  ShortIronPrice = COALESCE(ShortIronPrice, 0),
  ShredSteelWeight = COALESCE(ShredSteelWeight, 0),
  ShredSteelPrice = COALESCE(ShredSteelPrice, 0),
  AluminumBreakageWeight = COALESCE(AluminumBreakageWeight, 0),
  AluminumBreakagePrice = COALESCE(AluminumBreakagePrice, 0),
  DirtyAluminumRadiatorsWeight = COALESCE(DirtyAluminumRadiatorsWeight, 0),
  DirtyAluminumRadiatorsPrice = COALESCE(DirtyAluminumRadiatorsPrice, 0),
  WiringHarnessWeight = COALESCE(WiringHarnessWeight, 0),
  WiringHarnessPrice = COALESCE(WiringHarnessPrice, 0),
  ACCompressorWeight = COALESCE(ACCompressorWeight, 0),
  ACCompressorPrice = COALESCE(ACCompressorPrice, 0),
  AlternatorStarterWeight = COALESCE(AlternatorStarterWeight, 0),
  AlternatorStarterPrice = COALESCE(AlternatorStarterPrice, 0),
  AluminumRimsWeight = COALESCE(AluminumRimsWeight, 0),
  AluminumRimsPrice = COALESCE(AluminumRimsPrice, 0),
  ChromeRimsWeight = COALESCE(ChromeRimsWeight, 0),
  ChromeRimsPrice = COALESCE(ChromeRimsPrice, 0),
  BrassCopperRadiatorWeight = COALESCE(BrassCopperRadiatorWeight, 0),
  BrassCopperRadiatorPrice = COALESCE(BrassCopperRadiatorPrice, 0);

ALTER TABLE AutoReceiptMetals
  ALTER COLUMN DrumsRotorsWeight SET NOT NULL,
  ALTER COLUMN DrumsRotorsPrice SET NOT NULL,
  ALTER COLUMN ShortIronWeight SET NOT NULL,
  ALTER COLUMN ShortIronPrice SET NOT NULL,
  ALTER COLUMN ShredSteelWeight SET NOT NULL,
  ALTER COLUMN ShredSteelPrice SET NOT NULL,
  ALTER COLUMN AluminumBreakageWeight SET NOT NULL,
  ALTER COLUMN AluminumBreakagePrice SET NOT NULL,
  ALTER COLUMN DirtyAluminumRadiatorsWeight SET NOT NULL,
  ALTER COLUMN DirtyAluminumRadiatorsPrice SET NOT NULL,
  ALTER COLUMN WiringHarnessWeight SET NOT NULL,
  ALTER COLUMN WiringHarnessPrice SET NOT NULL,
  ALTER COLUMN ACCompressorWeight SET NOT NULL,
  ALTER COLUMN ACCompressorPrice SET NOT NULL,
  ALTER COLUMN AlternatorStarterWeight SET NOT NULL,
  ALTER COLUMN AlternatorStarterPrice SET NOT NULL,
  ALTER COLUMN AluminumRimsWeight SET NOT NULL,
  ALTER COLUMN AluminumRimsPrice SET NOT NULL,
  ALTER COLUMN ChromeRimsWeight SET NOT NULL,
  ALTER COLUMN ChromeRimsPrice SET NOT NULL,
  ALTER COLUMN BrassCopperRadiatorWeight SET NOT NULL,
  ALTER COLUMN BrassCopperRadiatorPrice SET NOT NULL;

-- Handle HVACReceiptMetals table
UPDATE HVACReceiptMetals SET
  ShredSteelWeight = COALESCE(ShredSteelWeight, 0),
  ShredSteelPrice = COALESCE(ShredSteelPrice, 0),
  DirtyAlumCopperRadiatorsWeight = COALESCE(DirtyAlumCopperRadiatorsWeight, 0),
  DirtyAlumCopperRadiatorsPrice = COALESCE(DirtyAlumCopperRadiatorsPrice, 0),
  CleanAluminumRadiatorsWeight = COALESCE(CleanAluminumRadiatorsWeight, 0),
  CleanAluminumRadiatorsPrice = COALESCE(CleanAluminumRadiatorsPrice, 0),
  CopperTwoWeight = COALESCE(CopperTwoWeight, 0),
  CopperTwoPrice = COALESCE(CopperTwoPrice, 0),
  CompressorsWeight = COALESCE(CompressorsWeight, 0),
  CompressorsPrice = COALESCE(CompressorsPrice, 0),
  DirtyBrassWeight = COALESCE(DirtyBrassWeight, 0),
  DirtyBrassPrice = COALESCE(DirtyBrassPrice, 0),
  ElectricMotorsWeight = COALESCE(ElectricMotorsWeight, 0),
  ElectricMotorsPrice = COALESCE(ElectricMotorsPrice, 0),
  AluminumBreakageWeight = COALESCE(AluminumBreakageWeight, 0),
  AluminumBreakagePrice = COALESCE(AluminumBreakagePrice, 0);

ALTER TABLE HVACReceiptMetals
  ALTER COLUMN ShredSteelWeight SET NOT NULL,
  ALTER COLUMN ShredSteelPrice SET NOT NULL,
  ALTER COLUMN DirtyAlumCopperRadiatorsWeight SET NOT NULL,
  ALTER COLUMN DirtyAlumCopperRadiatorsPrice SET NOT NULL,
  ALTER COLUMN CleanAluminumRadiatorsWeight SET NOT NULL,
  ALTER COLUMN CleanAluminumRadiatorsPrice SET NOT NULL,
  ALTER COLUMN CopperTwoWeight SET NOT NULL,
  ALTER COLUMN CopperTwoPrice SET NOT NULL,
  ALTER COLUMN CompressorsWeight SET NOT NULL,
  ALTER COLUMN CompressorsPrice SET NOT NULL,
  ALTER COLUMN DirtyBrassWeight SET NOT NULL,
  ALTER COLUMN DirtyBrassPrice SET NOT NULL,
  ALTER COLUMN ElectricMotorsWeight SET NOT NULL,
  ALTER COLUMN ElectricMotorsPrice SET NOT NULL,
  ALTER COLUMN AluminumBreakageWeight SET NOT NULL,
  ALTER COLUMN AluminumBreakagePrice SET NOT NULL;

-- Handle InsulationReceiptMetals table
UPDATE InsulationReceiptMetals SET
  DumpFee = COALESCE(DumpFee, 0),
  HaulFee = COALESCE(HaulFee, 0);

ALTER TABLE InsulationReceiptMetals
  ALTER COLUMN DumpFee SET NOT NULL,
  ALTER COLUMN HaulFee SET NOT NULL;