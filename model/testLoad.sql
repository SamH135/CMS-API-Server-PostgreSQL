-- testLoad.sql

-- Insert sample clients
INSERT INTO Client (ClientID, ClientName, ClientLocation, ClientType, AvgTimeBetweenPickups, LocationNotes, RegistrationDate, LocationContact, TotalPayout, TotalVolume, PaymentMethod, LastPickupDate, NeedsPickup)
VALUES
('C001', 'Auto Shop A', '123 Main St, Anytown, USA', 'auto', 14, 'Behind the garage', '2023-01-01', 'John Doe', 7500.00, 3800.00, 'check', '2023-06-15', true),
('C002', 'HVAC Services Inc', '456 Oak Rd, Othertown, USA', 'hvac', 21, 'Front office', '2023-02-15', 'Jane Smith', 6000.00, 2550.00, 'direct deposit', '2023-06-20', false),
('C003', 'Insulation Experts', '789 Pine Ave, Somewhere, USA', 'insulation', 30, 'Side entrance', '2023-03-01', 'Bob Johnson', 2000.00, 0.00, 'credit card', '2023-06-25', true),
('C004', 'Auto Shop B', '321 Elm St, Elsewhere, USA', 'auto', 14, 'Next to gas station', '2023-04-01', 'Alice Brown', 5000.00, 2650.00, 'direct deposit', '2023-06-30', false),
('C005', 'HVAC Pros', '654 Maple Dr, Nexttown, USA', 'hvac', 28, 'Warehouse area', '2023-05-01', 'Charlie Davis', 4500.00, 1875.00, 'check', '2023-07-05', true);

-- Insert sample users
INSERT INTO "User" (Username, Password, UserType)
VALUES
('admin1', 'hashed_password_1', 'admin'),
('user1', 'hashed_password_2', 'regular'),
('user2', 'hashed_password_3', 'regular');

-- Insert sample receipts
INSERT INTO Receipt (ClientID, PaymentMethod, TotalVolume, TotalPayout, PickupDate, PickupTime, CreatedBy)
VALUES
('C001', 'check', 760.00, 1500.00, '2023-06-15', '2023-06-15 10:00:00', 'user1'),
('C002', 'direct deposit', 510.00, 1200.00, '2023-06-20', '2023-06-20 11:30:00', 'user1'),
('C003', 'credit card', 0.00, 400.00, '2023-06-25', '2023-06-25 09:15:00', 'user2'),
('C004', 'direct deposit', 530.00, 1000.00, '2023-06-30', '2023-06-30 14:45:00', 'user2'),
('C005', 'check', 375.00, 900.00, '2023-07-05', '2023-07-05 13:20:00', 'user1');

-- Insert sample user-defined metals
INSERT INTO UserDefinedMetal (ReceiptID, MetalName, Weight, Price)
VALUES
(1, 'Custom Alloy', 10.5, 52.50),
(2, 'Exotic Metal', 5.2, 104.00),
(4, 'Rare Earth Magnet', 2.3, 115.00);

-- Insert sample requests
INSERT INTO Request (ClientID, RequestDate, RequestTime, NumFullBarrels, LargeObjects, Notes)
VALUES
('C001', '2023-07-10', '2023-07-10 08:00:00', 2, 'One large engine block', 'Please come before noon'),
('C002', '2023-07-12', '2023-07-12 13:00:00', 1, 'Several old AC units', 'Access through back gate'),
('C005', '2023-07-15', '2023-07-15 10:30:00', 3, 'Large industrial fan', 'Call upon arrival');

-- Insert sample auto client totals
INSERT INTO AutoClientTotals (ClientID, TotalDrumsRotors, TotalShortIron, TotalShredSteel, TotalAluminumBreakage, TotalDirtyAluminumRadiators, TotalWiringHarness, TotalACCompressor, TotalAlternatorStarter, TotalAluminumRims, TotalChromeRims, TotalBrassCopperRadiator, TotalPayout)
VALUES
('C001', 500.00, 750.00, 1000.00, 250.00, 300.00, 100.00, 200.00, 150.00, 400.00, 100.00, 50.00, 7500.00),
('C004', 300.00, 500.00, 800.00, 150.00, 200.00, 75.00, 150.00, 100.00, 300.00, 50.00, 25.00, 5000.00);

-- Insert sample auto receipt metals
INSERT INTO AutoReceiptMetals (ReceiptID, DrumsRotorsWeight, DrumsRotorsPrice, ShortIronWeight, ShortIronPrice, ShredSteelWeight, ShredSteelPrice, AluminumBreakageWeight, AluminumBreakagePrice, DirtyAluminumRadiatorsWeight, DirtyAluminumRadiatorsPrice, WiringHarnessWeight, WiringHarnessPrice, ACCompressorWeight, ACCompressorPrice, AlternatorStarterWeight, AlternatorStarterPrice, AluminumRimsWeight, AluminumRimsPrice, ChromeRimsWeight, ChromeRimsPrice, BrassCopperRadiatorWeight, BrassCopperRadiatorPrice)
VALUES
(1, 100.00, 50.00, 150.00, 45.00, 200.00, 60.00, 50.00, 35.00, 60.00, 48.00, 20.00, 30.00, 40.00, 36.00, 30.00, 27.00, 80.00, 68.00, 20.00, 24.00, 10.00, 20.00),
(4, 60.00, 30.00, 100.00, 30.00, 160.00, 48.00, 30.00, 21.00, 40.00, 32.00, 15.00, 22.50, 30.00, 27.00, 20.00, 18.00, 60.00, 51.00, 10.00, 12.00, 5.00, 10.00);

-- Insert sample auto prices
INSERT INTO SetAutoPrices (EffectiveDate, DrumsRotorsPrice, ShortIronPrice, ShredSteelPrice, AluminumBreakagePrice, DirtyAluminumRadiatorsPrice, WiringHarnessPrice, ACCompressorPrice, AlternatorStarterPrice, AluminumRimsPrice, ChromeRimsPrice, BrassCopperRadiatorPrice)
VALUES
('2023-07-01', 0.50, 0.30, 0.30, 0.70, 0.80, 1.50, 0.90, 0.90, 0.85, 1.20, 2.00);

-- Insert sample catalytic converters
INSERT INTO CatalyticConverter (ReceiptID, PartNumber, Price, PercentFull)
VALUES
(1, 'CAT001', 150.00, 90.00),
(1, 'CAT002', 120.00, 80.00),
(4, 'CAT003', 180.00, 95.00);

-- Insert sample HVAC client totals
INSERT INTO HVACClientTotals (ClientID, TotalShredSteel, TotalDirtyAlumCopperRadiators, TotalCleanAluminumRadiators, TotalCopperTwo, TotalCompressors, TotalDirtyBrass, TotalElectricMotors, TotalAluminumBreakage, TotalPayout)
VALUES
('C002', 800.00, 400.00, 300.00, 200.00, 350.00, 100.00, 250.00, 150.00, 6000.00),
('C005', 600.00, 300.00, 200.00, 150.00, 250.00, 75.00, 200.00, 100.00, 4500.00);

-- Insert sample HVAC receipt metals
INSERT INTO HVACReceiptMetals (ReceiptID, ShredSteelWeight, ShredSteelPrice, DirtyAlumCopperRadiatorsWeight, DirtyAlumCopperRadiatorsPrice, CleanAluminumRadiatorsWeight, CleanAluminumRadiatorsPrice, CopperTwoWeight, CopperTwoPrice, CompressorsWeight, CompressorsPrice, DirtyBrassWeight, DirtyBrassPrice, ElectricMotorsWeight, ElectricMotorsPrice, AluminumBreakageWeight, AluminumBreakagePrice)
VALUES
(2, 160.00, 48.00, 80.00, 64.00, 60.00, 54.00, 40.00, 120.00, 70.00, 56.00, 20.00, 30.00, 50.00, 40.00, 30.00, 21.00),
(5, 120.00, 36.00, 60.00, 48.00, 40.00, 36.00, 30.00, 90.00, 50.00, 40.00, 15.00, 22.50, 40.00, 32.00, 20.00, 14.00);

-- Insert sample HVAC prices
INSERT INTO SetHVACPrices (EffectiveDate, ShredSteelPrice, DirtyAlumCopperRadiatorsPrice, CleanAluminumRadiatorsPrice, CopperTwoPrice, CompressorsPrice, DirtyBrassPrice, ElectricMotorsPrice, AluminumBreakagePrice)
VALUES
('2023-07-01', 0.30, 0.80, 0.90, 3.00, 0.80, 1.50, 0.80, 0.70);

-- Insert sample insulation client totals
INSERT INTO InsulationClientTotals (ClientID, TotalDumpFees, TotalHaulFees)
VALUES
('C003', 1500.00, 500.00);

-- Insert sample insulation receipt metals
INSERT INTO InsulationReceiptMetals (ReceiptID, DumpFee, HaulFee)
VALUES
(3, 300.00, 100.00);





-- Additional sample clients
INSERT INTO Client (ClientID, ClientName, ClientLocation, ClientType, AvgTimeBetweenPickups, LocationNotes, RegistrationDate, LocationContact, TotalPayout, TotalVolume, PaymentMethod, LastPickupDate, NeedsPickup)
VALUES
('C006', 'Quick Fix Auto', '987 Spruce Ln, Uptown, USA', 'auto', 10, 'Red building on corner', '2023-05-15', 'David Wilson', 3500.00, 1800.00, 'check', '2023-07-10', false),
('C007', 'Cool Breeze HVAC', '654 Birch St, Downtown, USA', 'hvac', 18, 'Enter through side door', '2023-06-01', 'Emma Rodriguez', 2800.00, 1200.00, 'direct deposit', '2023-07-12', true),
('C008', 'Cozy Home Insulation', '321 Cedar Ave, Midtown, USA', 'insulation', 25, 'Park in rear lot', '2023-06-15', 'Frank Thomas', 1500.00, 0.00, 'credit card', '2023-07-15', false),
('C009', 'Speedway Auto Repair', '159 Race St, Fastville, USA', 'auto', 7, 'Next to the racetrack', '2023-07-01', 'Gina Parker', 2000.00, 950.00, 'direct deposit', '2023-07-18', true),
('C010', 'Frosty Air Conditioning', '753 Snowflake Dr, Cooltown, USA', 'hvac', 14, 'Blue and white building', '2023-07-05', 'Henry Frost', 1800.00, 800.00, 'check', '2023-07-20', false),
('C011', 'Green Insulation Co', '951 Eco Rd, Greenville, USA', 'insulation', 30, 'Look for solar panels', '2023-07-10', 'Ivy Green', 1000.00, 0.00, 'credit card', '2023-07-22', true),
('C012', 'Raydons Auto Salvage', '357 Junkyard Ln, Rustville, USA', 'auto', 5, 'Large lot with fence', '2023-07-15', 'Rusty Jones', 5500.00, 3000.00, 'check', '2023-07-25', false),
('C013', 'AirPro HVAC Solutions', '246 Breeze Way, Windytown, USA', 'hvac', 21, 'Second floor office', '2023-07-20', 'Karen Wind', 3200.00, 1400.00, 'direct deposit', '2023-07-28', true),
('C014', 'Snug Fit Insulation', '135 Cozy Ct, Warmburg, USA', 'insulation', 28, 'Knock on garage door', '2023-07-25', 'Larry Snug', 800.00, 0.00, 'credit card', '2023-07-30', false),
('C015', 'Elite Auto Care', '864 Luxury Ln, Fancyville, USA', 'auto', 12, 'Gated entrance, use code 1234', '2023-08-01', 'Monica Elite', 4000.00, 2100.00, 'direct deposit', '2023-08-02', true);



-- Additional sample receipts
INSERT INTO Receipt (ClientID, PaymentMethod, TotalVolume, TotalPayout, PickupDate, PickupTime, CreatedBy)
VALUES
('C006', 'check', 360.00, 720.00, '2023-07-10', '2023-07-10 09:30:00', 'user1'),
('C007', 'direct deposit', 240.00, 576.00, '2023-07-12', '2023-07-12 11:00:00', 'user2'),
('C008', 'credit card', 0.00, 300.00, '2023-07-15', '2023-07-15 13:45:00', 'user1'),
('C009', 'direct deposit', 190.00, 380.00, '2023-07-18', '2023-07-18 10:15:00', 'user2'),
('C010', 'check', 160.00, 384.00, '2023-07-20', '2023-07-20 14:30:00', 'user1'),
('C011', 'credit card', 0.00, 200.00, '2023-07-22', '2023-07-22 09:00:00', 'user2'),
('C012', 'check', 600.00, 1200.00, '2023-07-25', '2023-07-25 11:30:00', 'user1'),
('C013', 'direct deposit', 280.00, 672.00, '2023-07-28', '2023-07-28 13:00:00', 'user2'),
('C014', 'credit card', 0.00, 160.00, '2023-07-30', '2023-07-30 10:45:00', 'user1'),
('C015', 'direct deposit', 420.00, 840.00, '2023-08-02', '2023-08-02 12:15:00', 'user2');

-- Additional auto client totals
INSERT INTO AutoClientTotals (ClientID, TotalDrumsRotors, TotalShortIron, TotalShredSteel, TotalAluminumBreakage, TotalDirtyAluminumRadiators, TotalWiringHarness, TotalACCompressor, TotalAlternatorStarter, TotalAluminumRims, TotalChromeRims, TotalBrassCopperRadiator, TotalPayout)
VALUES
('C006', 250.00, 375.00, 500.00, 125.00, 150.00, 50.00, 100.00, 75.00, 200.00, 50.00, 25.00, 3500.00),
('C009', 150.00, 225.00, 300.00, 75.00, 90.00, 30.00, 60.00, 45.00, 120.00, 30.00, 15.00, 2000.00),
('C012', 400.00, 600.00, 800.00, 200.00, 240.00, 80.00, 160.00, 120.00, 320.00, 80.00, 40.00, 5500.00),
('C015', 280.00, 420.00, 560.00, 140.00, 168.00, 56.00, 112.00, 84.00, 224.00, 56.00, 28.00, 4000.00);

-- Additional auto receipt metals
INSERT INTO AutoReceiptMetals (ReceiptID, DrumsRotorsWeight, DrumsRotorsPrice, ShortIronWeight, ShortIronPrice, ShredSteelWeight, ShredSteelPrice, AluminumBreakageWeight, AluminumBreakagePrice, DirtyAluminumRadiatorsWeight, DirtyAluminumRadiatorsPrice, WiringHarnessWeight, WiringHarnessPrice, ACCompressorWeight, ACCompressorPrice, AlternatorStarterWeight, AlternatorStarterPrice, AluminumRimsWeight, AluminumRimsPrice, ChromeRimsWeight, ChromeRimsPrice, BrassCopperRadiatorWeight, BrassCopperRadiatorPrice)
VALUES
(6, 50.00, 25.00, 75.00, 22.50, 100.00, 30.00, 25.00, 17.50, 30.00, 24.00, 10.00, 15.00, 20.00, 18.00, 15.00, 13.50, 40.00, 34.00, 10.00, 12.00, 5.00, 10.00),
(9, 30.00, 15.00, 45.00, 13.50, 60.00, 18.00, 15.00, 10.50, 18.00, 14.40, 6.00, 9.00, 12.00, 10.80, 9.00, 8.10, 24.00, 20.40, 6.00, 7.20, 3.00, 6.00),
(12, 80.00, 40.00, 120.00, 36.00, 160.00, 48.00, 40.00, 28.00, 48.00, 38.40, 16.00, 24.00, 32.00, 28.80, 24.00, 21.60, 64.00, 54.40, 16.00, 19.20, 8.00, 16.00),
(15, 56.00, 28.00, 84.00, 25.20, 112.00, 33.60, 28.00, 19.60, 33.60, 26.88, 11.20, 16.80, 22.40, 20.16, 16.80, 15.12, 44.80, 38.08, 11.20, 13.44, 5.60, 11.20);

-- Additional HVAC client totals
INSERT INTO HVACClientTotals (ClientID, TotalShredSteel, TotalDirtyAlumCopperRadiators, TotalCleanAluminumRadiators, TotalCopperTwo, TotalCompressors, TotalDirtyBrass, TotalElectricMotors, TotalAluminumBreakage, TotalPayout)
VALUES
('C007', 400.00, 200.00, 150.00, 100.00, 175.00, 50.00, 125.00, 75.00, 2800.00),
('C010', 250.00, 125.00, 95.00, 65.00, 110.00, 30.00, 80.00, 45.00, 1800.00),
('C013', 450.00, 225.00, 170.00, 115.00, 200.00, 60.00, 140.00, 85.00, 3200.00);

-- Additional HVAC receipt metals
INSERT INTO HVACReceiptMetals (ReceiptID, ShredSteelWeight, ShredSteelPrice, DirtyAlumCopperRadiatorsWeight, DirtyAlumCopperRadiatorsPrice, CleanAluminumRadiatorsWeight, CleanAluminumRadiatorsPrice, CopperTwoWeight, CopperTwoPrice, CompressorsWeight, CompressorsPrice, DirtyBrassWeight, DirtyBrassPrice, ElectricMotorsWeight, ElectricMotorsPrice, AluminumBreakageWeight, AluminumBreakagePrice)
VALUES
(7, 80.00, 24.00, 40.00, 32.00, 30.00, 27.00, 20.00, 60.00, 35.00, 28.00, 10.00, 15.00, 25.00, 20.00, 15.00, 10.50),
(10, 50.00, 15.00, 25.00, 20.00, 19.00, 17.10, 13.00, 39.00, 22.00, 17.60, 6.00, 9.00, 16.00, 12.80, 9.00, 6.30),
(13, 90.00, 27.00, 45.00, 36.00, 34.00, 30.60, 23.00, 69.00, 40.00, 32.00, 12.00, 18.00, 28.00, 22.40, 17.00, 11.90);

-- Additional insulation client totals
INSERT INTO InsulationClientTotals (ClientID, TotalDumpFees, TotalHaulFees)
VALUES
('C008', 1125.00, 375.00),
('C011', 750.00, 250.00),
('C014', 600.00, 200.00);

-- Additional insulation receipt metals
INSERT INTO InsulationReceiptMetals (ReceiptID, DumpFee, HaulFee)
VALUES
(8, 225.00, 75.00),
(11, 150.00, 50.00),
(14, 120.00, 40.00);


