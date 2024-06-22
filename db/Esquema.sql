-- MySQL Script for GeoTrackMine
-- Model: GeoTrackMine

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema GeoTrackMine
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `GeoTrackMine` DEFAULT CHARACTER SET utf8;
USE `GeoTrackMine`;

-- -----------------------------------------------------
-- Table `GeoTrackMine`.`Despachadores`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `GeoTrackMine`.`Despachadores` (
  `dispatcherID` VARCHAR(255) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `GeoTrackMine`.`Alertas`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `GeoTrackMine`.`Alertas` (
  `alertID` VARCHAR(255) PRIMARY KEY,
  `alertType` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `timestamp` DATETIME NOT NULL,
  `dispatcherID` VARCHAR(255),
  FOREIGN KEY (`dispatcherID`) REFERENCES `GeoTrackMine`.`Despachadores`(`dispatcherID`) ON DELETE SET NULL
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `GeoTrackMine`.`GPSData`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `GeoTrackMine`.`GPSData` (
  `fileID` VARCHAR(255) NOT NULL,
  `batchID` INT NOT NULL AUTO_INCREMENT,
  `data` JSON NOT NULL,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `originalFileName` VARCHAR(255) NOT NULL,
  `fileDate` DATETIME NOT NULL,
  PRIMARY KEY (`batchID`),
  UNIQUE KEY `unique_fileID_batchID` (`fileID`, `batchID`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `GeoTrackMine`.`AlertManager`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `GeoTrackMine`.`AlertManager` (
  `managerID` INT AUTO_INCREMENT PRIMARY KEY,
  `alertThresholds` JSON NOT NULL,
  `dataBuffer` JSON NOT NULL,
  `alertsGenerated` JSON NOT NULL,
  `lastProcessedTimestamp` DATETIME NOT NULL,
  `processingInterval` INT NOT NULL
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `GeoTrackMine`.`HTTPLogs`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `GeoTrackMine`.`HTTPLogs` (
  `logId` INT AUTO_INCREMENT PRIMARY KEY,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `requestMethod` VARCHAR(10),
  `requestURL` VARCHAR(255),
  `userAgent` VARCHAR(255),
  `clientIP` VARCHAR(45) NULL,
  `referer` VARCHAR(255) NULL,
  `logLevel` VARCHAR(10) DEFAULT 'INFO',
  `httpStatus` INT,
  `responseTime` FLOAT,
  `errorMessage` TEXT
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `GeoTrackMine`.`Logs`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `GeoTrackMine`.`Logs` (
  `logId` INT AUTO_INCREMENT PRIMARY KEY,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `level` VARCHAR(10),  -- INFO, WARNING, ERROR, DEBUG
  `message` TEXT,
  `component` VARCHAR(255),  -- Part of the system where the log occurs
  `details` JSON  -- JSON to store additional structured details
) ENGINE = InnoDB;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;