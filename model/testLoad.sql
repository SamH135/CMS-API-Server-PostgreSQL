-- Insert mock data into Client table
INSERT INTO Client (ClientID, ClientName, ClientLocation, ClientType, AvgTimeBetweenPickups, LocationNotes, RegistrationDate, LocationContact, TotalPayout, TotalVolume, PaymentMethod, LastPickupDate, NeedsPickup)
VALUES
('AUTO001', 'AutoShop A', '123 Main St, Cityville', 'auto', 14, 'Behind the garage', '2023-01-01', 'John Doe', 5000.00, 1000.00, 'Check', '2024-06-01', true),
('HVAC001', 'CoolAir Inc', '456 Oak Ave, Townsburg', 'hvac', 21, 'Front office', '2023-02-15', 'Jane Smith', 3000.00, 750.00, 'Direct Deposit', '2024-06-10', false),
('INSL001', 'Insulate-Pro', '789 Pine Rd, Villageton', 'insulation', 30, 'Warehouse entrance', '2023-03-30', 'Bob Johnson', 2000.00, 500.00, 'Cash', '2024-05-25', true);

-- Insert mock data into User table
INSERT INTO "User" (Username, Password, UserType)
VALUES
('admin1', 'hashed_password_1', 'admin'),
('user1', 'hashed_password_2', 'regular');

-- Insert mock data into Receipt table
INSERT INTO Receipt (ClientID, TotalVolume, TotalPayout, PickupDate, PickupTime)
VALUES
('AUTO001', 100.00, 500.00, '2024-06-01', '2024-06-01 10:00:00'),
('HVAC001', 75.00, 300.00, '2024-06-10', '2024-06-10 14:30:00'),
('INSL001', 50.00, 200.00, '2024-05-25', '2024-05-25 11:15:00');

-- Insert mock data into UserDefinedMetal table
INSERT INTO UserDefinedMetal (ReceiptID, MetalName, Weight, Price)
VALUES
(1, 'Custom Alloy', 25.5, 127.50),
(2, 'Mixed Metal', 10.0, 50.00);

-- Insert mock data into Request table
INSERT INTO Request (ClientID, RequestDate, RequestTime, NumFullBarrels, LargeObjects, Notes)
VALUES
('AUTO001', '2024-06-15', '2024-06-15 09:00:00', 2, 'Engine block', 'Please bring forklift'),
('HVAC001', '2024-06-20', '2024-06-20 13:00:00', 1, NULL, 'Regular pickup');

-- Insert mock data into AutoClientTotals table
INSERT INTO AutoClientTotals (ClientID, TotalDrumsRotors, TotalShortIron, TotalSteelShred, TotalAluminumRadiators, TotalBrassCopperRadiators, TotalAluminum, TotalCatalyticConverters, TotalBatteries, TotalPayout)
VALUES
('AUTO001', 500.00, 1000.00, 750.00, 200.00, 150.00, 300.00, 10, 100.00, 5000.00);

-- Insert mock data into HVACClientTotals table
INSERT INTO HVACClientTotals (ClientID, TotalSteelShred, TotalCopper, TotalBrass, TotalCompressors, TotalCopperCoils, TotalAluminumCoils, TotalWire, TotalBrassCopperBreakage, TotalElectricMotors, TotalPayout)
VALUES
('HVAC001', 300.00, 100.00, 50.00, 200.00, 75.00, 50.00, 25.00, 30.00, 40.00, 3000.00);

-- Insert mock data into InsulationClientTotals table
INSERT INTO InsulationClientTotals (ClientID, TotalSteelShred, TotalLoadsOfTrash, TotalPayout)
VALUES
('INSL001', 400.00, 5, 2000.00);

-- Insert mock data into CatalyticConverter table
INSERT INTO CatalyticConverter (ReceiptID, PartNumber, Price, PercentFull)
VALUES
(1, 'CAT001', 150.00, 90.00),
(1, 'CAT002', 120.00, 85.00);

-- Insert mock data into AutoReceiptMetals table
INSERT INTO AutoReceiptMetals (ReceiptID, DrumsRotorsWeight, DrumsRotorsPrice, ShortIronWeight, ShortIronPrice, SteelShredWeight, SteelShredPrice, AluminumRadiatorsWeight, AluminumRadiatorsPrice, BrassCopperRadiatorsWeight, BrassCopperRadiatorsPrice, AluminumWeight, AluminumPrice, BatteriesWeight, BatteriesPrice)
VALUES
(1, 50.00, 25.00, 100.00, 50.00, 75.00, 37.50, 20.00, 40.00, 15.00, 45.00, 30.00, 60.00, 10.00, 20.00);

-- Insert mock data into HVACReceiptMetals table
INSERT INTO HVACReceiptMetals (ReceiptID, SteelShredWeight, SteelShredPrice, CopperWeight, CopperPrice, BrassWeight, BrassPrice, CompressorsWeight, CompressorsPrice, CopperCoilsWeight, CopperCoilsPrice, AluminumCoilsWeight, AluminumCoilsPrice, WireWeight, WirePrice, BrassCopperBreakageWeight, BrassCopperBreakagePrice, ElectricMotorsWeight, ElectricMotorsPrice)
VALUES
(2, 30.00, 15.00, 10.00, 30.00, 5.00, 15.00, 20.00, 40.00, 7.50, 22.50, 5.00, 10.00, 2.50, 7.50, 3.00, 9.00, 4.00, 8.00);

-- Insert mock data into InsulationReceiptMetals table
INSERT INTO InsulationReceiptMetals (ReceiptID, SteelShredWeight, SteelShredPrice, LoadsOfTrash, LoadsOfTrashPrice)
VALUES
(3, 40.00, 20.00, 1, 50.00);