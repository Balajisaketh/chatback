"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = void 0;
const multer_1 = __importDefault(require("multer"));
// Create a storage engine
exports.storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads'); // Set the destination folder for uploaded images
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`); // Set the filename for the uploaded image
    },
});
// Create the Multer instance
const upload = (0, multer_1.default)({ storage: exports.storage, limits: {
        fileSize: 1024 * 1024 * 8, // Set the maximum file size (e.g., 5MB)
    }, });
exports.default = upload;
