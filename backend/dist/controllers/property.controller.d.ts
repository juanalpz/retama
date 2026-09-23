import type { Request, Response } from "express";
declare class PropertyController {
    getById(request: Request, response: Response): Promise<void>;
    createComment(request: Request, response: Response): Promise<void>;
}
export declare const propertyController: PropertyController;
export {};
