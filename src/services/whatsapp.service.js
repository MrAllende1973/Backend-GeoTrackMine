// services/whatsapp.service.js
import twilio from 'twilio';
import dotenv from 'dotenv';
import { createLogger, transports, format } from 'winston';
import chalk from 'chalk';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const customFormat = format.printf(({ timestamp, level, message }) => {
    let colorizer = level === 'info' ? chalk.green :
                    level === 'warn' ? chalk.yellow :
                    level === 'error' ? chalk.red : chalk.blue;
    return `${chalk.blue(timestamp)} [${colorizer(level)}]: ${message}`;
});

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        customFormat
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'logs/whatsapp.log', format: format.combine(
            format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            customFormat
        )})
    ]
});

export const sendWhatsAppMessage = async (message) => {
    const from = process.env.TWILIO_WHATSAPP_NUMBER;
    const to = process.env.WHATSAPP_PHONE_NUMBER;

    try {
        const response = await client.messages.create({
            body: message,
            from,
            to
        });
        logger.info(`WhatsApp message sent to ${to}: ${response.sid}`);
    } catch (error) {
        logger.error(`Error sending WhatsApp message: ${error.message}`);
    }
};