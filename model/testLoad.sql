-- Insert test data into the Client table
INSERT INTO Client (ClientID, ClientName, ClientLocation, ClientType, AvgTimeBetweenPickups, LocationNotes, RegistrationDate, LocationContact, TotalPayout, TotalVolume, PaymentMethod, LastPickupDate, NeedsPickup)
VALUES
  ('C001', 'Client 1', '123 Main St', 'Residential', 14, 'Knock on the front door', '2023-01-01', 'John Doe', 100.00, 50.00, 'Cash', '2023-06-01', true),
  ('C002', 'Client 2', '456 Elm St', 'Commercial', 7, 'Use the side entrance', '2023-02-01', 'Jane Smith', 250.00, 120.00, 'Check', '2023-06-05', false),
  ('C003', 'Client 3', '789 Oak St', 'Residential', 21, 'Leave the bins by the garage', '2023-03-01', 'Mike Johnson', 150.00, 80.00, 'Credit Card', '2023-06-10', true);

-- Insert test data into the User table
INSERT INTO "User" (Username, Password, UserType)
VALUES
  ('admin', '$2a$08$c9XoO.8dW7qzY7t.KzLjPuXdVJRzLUb6vD2fOoRzTtQwS6vXOCiYm', 'admin'),
  ('user1', '$2a$08$EIiOB1mPjsMGOoRTTQI8NeqNiHVjlP2UJbBWyc4YapzlLJPSDIFWy', 'user'),
  ('user2', '$2a$08$OJpSrUGCQjGAajOxToLVKuEKkB3aE/BMGwQy9hcKsQV1hpXYUWv6.', 'user');

-- Insert test data into the Receipt table
INSERT INTO Receipt (ClientID, ClientName, TotalVolume, TotalPayout, PickupDate, PickupTime, OriginatorName)
VALUES
  ('C001', 'Client 1', 20.00, 50.00, '2023-06-01', '2023-06-01 09:30:00', 'John Doe'),
  ('C002', 'Client 2', 40.00, 100.00, '2023-06-05', '2023-06-05 14:45:00', 'Jane Smith'),
  ('C003', 'Client 3', 30.00, 75.00, '2023-06-10', '2023-06-10 11:15:00', 'Mike Johnson');

-- Insert test data into the UserDefinedMetal table
INSERT INTO UserDefinedMetal (ReceiptID, MetalName, Weight, Price)
VALUES
  (1, 'Custom Metal 1', 5.00, 10.00),
  (1, 'Custom Metal 2', 3.00, 8.00),
  (2, 'Custom Metal 3', 4.00, 12.00),
  (3, 'Custom Metal 4', 2.00, 6.00);

-- Insert test data into the Request table
INSERT INTO Request (ClientID, ClientName, RequestDate, RequestTime, NumFullBarrels, LargeObjects, Notes)
VALUES
  ('C001', 'Client 1', '2023-06-15', '2023-06-15 10:00:00', 2, 'Refrigerator', 'Please call before arriving'),
  ('C002', 'Client 2', '2023-06-20', '2023-06-20 13:30:00', 1, NULL, 'Pickup from the loading dock'),
  ('C003', 'Client 3', '2023-06-25', '2023-06-25 16:00:00', 3, 'Washing Machine', 'Additional pickup requested');