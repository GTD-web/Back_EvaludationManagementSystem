export interface AuthenticatedUser {
    id: string;
    email: string;
    name: string;
    employeeNumber: string;
    roles: string[];
}
export declare const CurrentUser: (...dataOrPipes: (keyof AuthenticatedUser | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | undefined)[]) => ParameterDecorator;
