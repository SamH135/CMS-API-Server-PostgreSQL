-- Insert test data into Client table
INSERT INTO Client (ClientID, ClientName, ClientLocation, ClientType, AvgTimeBetweenPickups, LocationNotes, RegistrationDate, LocationContact, TotalPayout, TotalVolume, PaymentMethod, LastPickupDate, NeedsPickup)
VALUES
('AUTO001', 'Joe''s Auto Shop', '123 Main St, Anytown, USA', 'auto', 14, 'Behind the red building', '2023-01-01', 'Joe Smith', 1000.00, 500.00, 'Check', '2023-06-15', true),
('HVAC001', 'Cool Air Services', '456 Oak Rd, Somewhere, USA', 'hvac', 30, 'Front office', '2023-02-15', 'Jane Doe', 750.00, 300.00, 'Direct Deposit', '2023-06-20', false),
('INSL001', 'Cozy Insulation Co', '789 Pine Ave, Elsewhere, USA', 'insulation', 60, 'Side entrance', '2023-03-10', 'Bob Johnson', 500.00, 1000.00, 'Cash', '2023-06-25', true);

-- Insert test data into User table
INSERT INTO "User" (Username, Password, UserType)
VALUES
('admin', '$2a$08$3JvZzfbo5Ou2hkHgWm/OCebxnbclDS2l7eQ6N/mLlDVlH5XTfpwIm', 'admin'),  -- password: adminpass
('user', '$2a$08$b6gLFXXG8UwzcxGglVHYJ.T0cEHqCRFcVYyfbzqd3x9KH2UT1Nk1W', 'regular'); -- password: userpass

-- Insert test data into Receipt table
INSERT INTO Receipt (ClientID, PaymentMethod, TotalVolume, TotalPayout, PickupDate, PickupTime, CreatedBy)
VALUES
('AUTO001', 'Check', 100.00, 200.00, '2023-06-15', '2023-06-15 10:00:00', 'user'),
('HVAC001', 'Direct Deposit', 75.00, 150.00, '2023-06-20', '2023-06-20 14:30:00', 'user'),
('INSL001', 'Cash', 200.00, 100.00, '2023-06-25', '2023-06-25 11:15:00', 'user');

-- Insert test data into UserDefinedMetal table
INSERT INTO UserDefinedMetal (ReceiptID, MetalName, Weight, Price)
VALUES
(1, 'Custom Alloy', 10.00, 20.00),
(2, 'Mixed Metal', 5.00, 15.00);

-- Insert test data into Request table
INSERT INTO Request (ClientID, RequestDate, RequestTime, NumFullBarrels, LargeObjects, Notes)
VALUES
('AUTO001', '2023-07-01', '2023-07-01 09:00:00', 2, 'One large engine block', 'Please come before noon'),
('HVAC001', '2023-07-15', '2023-07-15 13:00:00', 1, 'Several AC units', 'Call before arrival');

-- Insert test data into AutoClientTotals table
INSERT INTO AutoClientTotals (ClientID, TotalDrumsRotors, TotalShortIron, TotalShredSteel, TotalAluminumBreakage, TotalDirtyAluminumRadiators, TotalWiringHarness, TotalACCompressor, TotalAlternatorStarter, TotalAluminumRims, TotalChromeRims, TotalBrassCopperRadiator, TotalPayout)
VALUES
('AUTO001', 50.00, 100.00, 200.00, 30.00, 40.00, 20.00, 60.00, 70.00, 80.00, 90.00, 10.00, 1000.00);

-- Insert test data into AutoReceiptMetals table
INSERT INTO AutoReceiptMetals (ReceiptID, DrumsRotorsWeight, DrumsRotorsPrice, ShortIronWeight, ShortIronPrice, ShredSteelWeight, ShredSteelPrice, AluminumBreakageWeight, AluminumBreakagePrice, DirtyAluminumRadiatorsWeight, DirtyAluminumRadiatorsPrice, WiringHarnessWeight, WiringHarnessPrice, ACCompressorWeight, ACCompressorPrice, AlternatorStarterWeight, AlternatorStarterPrice, AluminumRimsWeight, AluminumRimsPrice, ChromeRimsWeight, ChromeRimsPrice, BrassCopperRadiatorWeight, BrassCopperRadiatorPrice)
VALUES
(1, 10.00, 20.00, 20.00, 30.00, 30.00, 40.00, 5.00, 10.00, 8.00, 16.00, 2.00, 6.00, 15.00, 45.00, 10.00, 20.00, 20.00, 60.00, 15.00, 75.00, 2.00, 10.00);

-- Insert test data into SetAutoPrices table
INSERT INTO SetAutoPrices (EffectiveDate, DrumsRotorsPrice, ShortIronPrice, ShredSteelPrice, AluminumBreakagePrice, DirtyAluminumRadiatorsPrice, WiringHarnessPrice, ACCompressorPrice, AlternatorStarterPrice, AluminumRimsPrice, ChromeRimsPrice, BrassCopperRadiatorPrice)
VALUES
('2023-07-01', 2.00, 1.50, 1.33, 2.00, 2.00, 3.00, 3.00, 2.00, 3.00, 5.00, 5.00);

-- Insert test data into HVACClientTotals table
INSERT INTO HVACClientTotals (ClientID, TotalSteelShred, TotalCopper, TotalBrass, TotalCompressors, TotalCopperCoils, TotalAluminumCoils, TotalWire, TotalBrassCopperBreakage, TotalElectricMotors, TotalPayout)
VALUES
('HVAC001', 100.00, 50.00, 30.00, 80.00, 40.00, 60.00, 20.00, 10.00, 70.00, 750.00);

-- Insert test data into InsulationClientTotals table
INSERT INTO InsulationClientTotals (ClientID, TotalSteelShred, TotalLoadsOfTrash, TotalPayout)
VALUES
('INSL001', 400.00, 5, 500.00);

-- Insert test data into CatalyticConverter table
INSERT INTO CatalyticConverter (ReceiptID, PartNumber, Price, PercentFull)
VALUES
(1, 'CAT001', 100.00, 90.00),
(1, 'CAT002', 80.00, 75.00);

-- Insert test data into HVACReceiptMetals table
INSERT INTO HVACReceiptMetals (ReceiptID, SteelShredWeight, SteelShredPrice, CopperWeight, CopperPrice, BrassWeight, BrassPrice, CompressorsWeight, CompressorsPrice, CopperCoilsWeight, CopperCoilsPrice, AluminumCoilsWeight, AluminumCoilsPrice, WireWeight, WirePrice, BrassCopperBreakageWeight, BrassCopperBreakagePrice, ElectricMotorsWeight, ElectricMotorsPrice)
VALUES
(2, 30.00, 40.00, 10.00, 30.00, 5.00, 15.00, 20.00, 60.00, 8.00, 32.00, 15.00, 45.00, 2.00, 6.00, 1.00, 4.00, 15.00, 45.00);

-- Insert test data into InsulationReceiptMetals table
INSERT INTO InsulationReceiptMetals (ReceiptID, SteelShredWeight, SteelShredPrice, LoadsOfTrash, LoadsOfTrashPrice)
VALUES
(3, 180.00, 240.00, 2, 100.00);