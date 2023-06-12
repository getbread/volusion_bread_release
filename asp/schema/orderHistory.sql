SELECT * 
FROM Orders
WHERE LastModified >= DATEADD(d, -90, GETDATE());

