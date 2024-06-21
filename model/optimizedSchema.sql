-- Create Client table
CREATE TABLE Client (
  ClientID VARCHAR(10) PRIMARY KEY,
  ClientName VARCHAR(100) NOT NULL,
  ClientLocation VARCHAR(200) NOT NULL,
  ClientType VARCHAR(50) NOT NULL,
  AvgTimeBetweenPickups INT CHECK (AvgTimeBetweenPickups >= 0),
  LocationNotes TEXT,
  RegistrationDate DATE NOT NULL,
  LocationContact VARCHAR(100),
  TotalPayout DECIMAL(10, 2) CHECK (TotalPayout >= 0),
  TotalVolume DECIMAL(10, 2) CHECK (TotalVolume >= 0),
  PaymentMethod VARCHAR(20),
  LastPickupDate DATE,
  NeedsPickup BOOLEAN NOT NULL,
  CONSTRAINT check_client_type CHECK (ClientType IN ('auto', 'hvac', 'insulation', 'other'))
);

CREATE INDEX ON Client (ClientName);
CREATE INDEX ON Client (ClientLocation);
CREATE INDEX ON Client (ClientType);
CREATE INDEX ON Client (LastPickupDate);
CREATE INDEX ON Client (NeedsPickup);

-- Create User table - for system users - allows for role-based access control (RBAC)
CREATE TABLE "User" (
  UserID SERIAL PRIMARY KEY,
  Username VARCHAR(50) NOT NULL,
  Password VARCHAR(255) NOT NULL,
  UserType VARCHAR(20) NOT NULL,
  CONSTRAINT check_user_type CHECK (UserType IN ('admin', 'regular'))
);

-- Create Receipt table - receipts created by employees using the RGC react app
CREATE TABLE Receipt (
  ReceiptID SERIAL PRIMARY KEY,
  ClientID VARCHAR(10) NOT NULL,
  TotalVolume DECIMAL(10, 2) CHECK (TotalVolume >= 0),
  TotalPayout DECIMAL(10, 2) CHECK (TotalPayout >= 0),
  PickupDate DATE NOT NULL,
  PickupTime TIMESTAMP NOT NULL,
  FOREIGN KEY (ClientID) REFERENCES Client(ClientID)
);

CREATE INDEX ON Receipt (ClientID);
CREATE INDEX ON Receipt (PickupDate);
CREATE INDEX ON Receipt (TotalPayout);

-- Create UserDefinedMetal table - allows employees to add custom metals to receipts
CREATE TABLE UserDefinedMetal (
  UserMetalID SERIAL PRIMARY KEY,
  ReceiptID INT NOT NULL,
  MetalName VARCHAR(100) NOT NULL,
  Weight DECIMAL(10, 2) CHECK (Weight >= 0),
  Price DECIMAL(10, 2) CHECK (Price >= 0),
  FOREIGN KEY (ReceiptID) REFERENCES Receipt(ReceiptID)
);

CREATE INDEX ON UserDefinedMetal (ReceiptID);

-- Create Request table - allows business clients to request pickups
CREATE TABLE Request (
  RequestID SERIAL PRIMARY KEY,
  ClientID VARCHAR(10) NOT NULL,
  RequestDate DATE NOT NULL,
  RequestTime TIMESTAMP NOT NULL,
  NumFullBarrels INT CHECK (NumFullBarrels >= 0),
  LargeObjects TEXT,
  Notes TEXT,
  FOREIGN KEY (ClientID) REFERENCES Client(ClientID)
);

CREATE INDEX ON Request (ClientID);
CREATE INDEX ON Request (RequestDate);

-- Create AutoClientTotals table - tracks running totals each client (automotive)
CREATE TABLE AutoClientTotals (
  ClientID VARCHAR(10) PRIMARY KEY,
  TotalDrumsRotors DECIMAL(10, 2) DEFAULT 0,
  TotalShortIron DECIMAL(10, 2) DEFAULT 0,
  TotalSteelShred DECIMAL(10, 2) DEFAULT 0,
  TotalAluminumRadiators DECIMAL(10, 2) DEFAULT 0,
  TotalBrassCopperRadiators DECIMAL(10, 2) DEFAULT 0,
  TotalAluminum DECIMAL(10, 2) DEFAULT 0,
  TotalCatalyticConverters INT DEFAULT 0,
  TotalBatteries DECIMAL(10, 2) DEFAULT 0,
  TotalPayout DECIMAL(10, 2) DEFAULT 0,
  FOREIGN KEY (ClientID) REFERENCES Client(ClientID)
);

CREATE INDEX ON AutoClientTotals (TotalPayout);

-- Create HVACClientTotals table - tracks running totals each client (hvac)
CREATE TABLE HVACClientTotals (
  ClientID VARCHAR(10) PRIMARY KEY,
  TotalSteelShred DECIMAL(10, 2) DEFAULT 0,
  TotalCopper DECIMAL(10, 2) DEFAULT 0,
  TotalBrass DECIMAL(10, 2) DEFAULT 0,
  TotalCompressors DECIMAL(10, 2) DEFAULT 0,
  TotalCopperCoils DECIMAL(10, 2) DEFAULT 0,
  TotalAluminumCoils DECIMAL(10, 2) DEFAULT 0,
  TotalWire DECIMAL(10, 2) DEFAULT 0,
  TotalBrassCopperBreakage DECIMAL(10, 2) DEFAULT 0,
  TotalElectricMotors DECIMAL(10, 2) DEFAULT 0,
  TotalPayout DECIMAL(10, 2) DEFAULT 0,
  FOREIGN KEY (ClientID) REFERENCES Client(ClientID)
);

CREATE INDEX ON HVACClientTotals (TotalPayout);

-- Create InsulationClientTotals table - tracks running totals each client (insulation)
CREATE TABLE InsulationClientTotals (
  ClientID VARCHAR(10) PRIMARY KEY,
  TotalSteelShred DECIMAL(10, 2) DEFAULT 0,
  TotalLoadsOfTrash INT DEFAULT 0,
  TotalPayout DECIMAL(10, 2) DEFAULT 0,
  FOREIGN KEY (ClientID) REFERENCES Client(ClientID)
);

CREATE INDEX ON InsulationClientTotals (TotalPayout);

-- Create CatalyticConverter table - tracks detailed catalytic info 
CREATE TABLE CatalyticConverter (
  ConverterID SERIAL PRIMARY KEY,
  ReceiptID INT NOT NULL,
  PartNumber VARCHAR(50) NOT NULL,
  Price DECIMAL(10, 2) CHECK (Price >= 0),
  PercentFull DECIMAL(5, 2) CHECK (PercentFull >= 0 AND PercentFull <= 100),
  FOREIGN KEY (ReceiptID) REFERENCES Receipt(ReceiptID)
);

CREATE INDEX ON CatalyticConverter (ReceiptID);
CREATE INDEX ON CatalyticConverter (PartNumber);

-- Create AutoReceiptMetals table - all the usual metals that appear on receipts (auto)
CREATE TABLE AutoReceiptMetals (
  ReceiptID INT PRIMARY KEY,
  DrumsRotorsWeight DECIMAL(10, 2) DEFAULT 0,
  DrumsRotorsPrice DECIMAL(10, 2) DEFAULT 0,
  ShortIronWeight DECIMAL(10, 2) DEFAULT 0,
  ShortIronPrice DECIMAL(10, 2) DEFAULT 0,
  SteelShredWeight DECIMAL(10, 2) DEFAULT 0,
  SteelShredPrice DECIMAL(10, 2) DEFAULT 0,
  AluminumRadiatorsWeight DECIMAL(10, 2) DEFAULT 0,
  AluminumRadiatorsPrice DECIMAL(10, 2) DEFAULT 0,
  BrassCopperRadiatorsWeight DECIMAL(10, 2) DEFAULT 0,
  BrassCopperRadiatorsPrice DECIMAL(10, 2) DEFAULT 0,
  AluminumWeight DECIMAL(10, 2) DEFAULT 0,
  AluminumPrice DECIMAL(10, 2) DEFAULT 0,
  BatteriesWeight DECIMAL(10, 2) DEFAULT 0,
  BatteriesPrice DECIMAL(10, 2) DEFAULT 0,
  FOREIGN KEY (ReceiptID) REFERENCES Receipt(ReceiptID)
);

CREATE INDEX ON AutoReceiptMetals (DrumsRotorsWeight, ShortIronWeight, SteelShredWeight, AluminumRadiatorsWeight, BrassCopperRadiatorsWeight, AluminumWeight, BatteriesWeight);

-- Create HVACReceiptMetals table - all the usual metals that appear on receipts (hvac)
CREATE TABLE HVACReceiptMetals (
  ReceiptID INT PRIMARY KEY,
  SteelShredWeight DECIMAL(10, 2) DEFAULT 0,
  SteelShredPrice DECIMAL(10, 2) DEFAULT 0,
  CopperWeight DECIMAL(10, 2) DEFAULT 0,
  CopperPrice DECIMAL(10, 2) DEFAULT 0,
  BrassWeight DECIMAL(10, 2) DEFAULT 0,
  BrassPrice DECIMAL(10, 2) DEFAULT 0,
  CompressorsWeight DECIMAL(10, 2) DEFAULT 0,
  CompressorsPrice DECIMAL(10, 2) DEFAULT 0,
  CopperCoilsWeight DECIMAL(10, 2) DEFAULT 0,
  CopperCoilsPrice DECIMAL(10, 2) DEFAULT 0,
  AluminumCoilsWeight DECIMAL(10, 2) DEFAULT 0,
  AluminumCoilsPrice DECIMAL(10, 2) DEFAULT 0,
  WireWeight DECIMAL(10, 2) DEFAULT 0,
  WirePrice DECIMAL(10, 2) DEFAULT 0,
  BrassCopperBreakageWeight DECIMAL(10, 2) DEFAULT 0,
  BrassCopperBreakagePrice DECIMAL(10, 2) DEFAULT 0,
  ElectricMotorsWeight DECIMAL(10, 2) DEFAULT 0,
  ElectricMotorsPrice DECIMAL(10, 2) DEFAULT 0,
  FOREIGN KEY (ReceiptID) REFERENCES Receipt(ReceiptID)
);

CREATE INDEX ON HVACReceiptMetals (SteelShredWeight, CopperWeight, BrassWeight, CompressorsWeight, CopperCoilsWeight, AluminumCoilsWeight, WireWeight, BrassCopperBreakageWeight, ElectricMotorsWeight);

-- Create InsulationReceiptMetals table - all the usual metals that appear on receipts (insulation)
CREATE TABLE InsulationReceiptMetals (
  ReceiptID INT PRIMARY KEY,
  SteelShredWeight DECIMAL(10, 2) DEFAULT 0,
  SteelShredPrice DECIMAL(10, 2) DEFAULT 0,
  LoadsOfTrash INT DEFAULT 0,
  LoadsOfTrashPrice DECIMAL(10, 2) DEFAULT 0,
  FOREIGN KEY (ReceiptID) REFERENCES Receipt(ReceiptID)
);

CREATE INDEX ON InsulationReceiptMetals (SteelShredWeight);