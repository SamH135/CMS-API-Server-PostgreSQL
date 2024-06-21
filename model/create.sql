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
  NeedsPickup BOOLEAN NOT NULL
);

CREATE INDEX ON Client (ClientName);
CREATE INDEX ON Client (ClientLocation);

-- Create User table - for system users
CREATE TABLE "User" (
  UserID SERIAL PRIMARY KEY,
  Username VARCHAR(50) UNIQUE NOT NULL,
  Password VARCHAR(255) NOT NULL,
  UserType VARCHAR(20) NOT NULL -- add constraint either admin/regular
);

-- Create Receipt table
CREATE TABLE Receipt (
  ReceiptID SERIAL PRIMARY KEY,
  ClientID VARCHAR(10) NOT NULL,
  ClientName VARCHAR(100) NOT NULL,
  TotalVolume DECIMAL(10, 2) CHECK (TotalVolume >= 0),
  TotalPayout DECIMAL(10, 2) CHECK (TotalPayout >= 0),
  PickupDate DATE NOT NULL,
  PickupTime TIMESTAMP NOT NULL,
  FOREIGN KEY (ClientID) REFERENCES Client(ClientID)
);

CREATE INDEX ON Receipt (ClientID);
CREATE INDEX ON Receipt (PickupDate);

-- Create UserDefinedMetal table - to allow users to add custom metals to receipts
CREATE TABLE UserDefinedMetal (
  UserMetalID SERIAL PRIMARY KEY,
  ReceiptID INT NOT NULL,
  MetalName VARCHAR(100) NOT NULL,
  Weight DECIMAL(10, 2) CHECK (Weight >= 0),
  Price DECIMAL(10, 2) CHECK (Price >= 0),
  FOREIGN KEY (ReceiptID) REFERENCES Receipt(ReceiptID)
);

CREATE INDEX ON UserDefinedMetal (ReceiptID);

-- Create Request table - tracks pickup requests from business clients
CREATE TABLE Request (
  RequestID SERIAL PRIMARY KEY,
  ClientID VARCHAR(10) NOT NULL,
  ClientName VARCHAR(100) NOT NULL,
  RequestDate DATE NOT NULL,
  RequestTime TIMESTAMP NOT NULL,
  NumFullBarrels INT CHECK (NumFullBarrels >= 0),
  LargeObjects TEXT,
  Notes TEXT,
  FOREIGN KEY (ClientID) REFERENCES Client(ClientID)
);

CREATE INDEX ON Request (ClientID);
CREATE INDEX ON Request (RequestDate);