DELIMITER //

CREATE PROCEDURE InsertGPSData(IN fileID VARCHAR(255), IN jsonData JSON, IN originalFileName VARCHAR(255), IN fileDate DATETIME)
BEGIN
    INSERT INTO GPSData (fileID, data, originalFileName, fileDate) VALUES (fileID, jsonData, originalFileName, fileDate);
END //

DELIMITER ;