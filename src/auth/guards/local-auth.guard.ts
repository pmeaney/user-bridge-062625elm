// src/auth/guards/local-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
Why have this mostly empty file & class?
1. In part, it's for Dependency Injection Compatibility
2. It could also provide Future Extensibility (i.e. we could add logic to limit login attempts to a certain time interval)
3. It's a little cleaner in terms of Mental Context & Code files.

The Complete Picture:
So while your guards appear empty, they're actually:
- Inheriting sophisticated authentication logic from Passport
- Integrating properly with NestJS's systems
- Providing extension points for future needs
- Following framework best practices
- Making your code more maintainable and clear

This pattern - creating thin wrapper classes around framework functionality - is common in enterprise applications. It provides a clean separation between your code and third-party libraries, making it easier to adapt if requirements change.

e.g. #2 above:@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    // Add custom pre-check
    const request = context.switchToHttp().getRequest();
    
    // Maybe check if login attempts are rate-limited
    if (this.tooManyAttempts(request.ip)) {
      throw new TooManyAttemptsException();
    }
    
    // Then do the normal authentication
    return super.canActivate(context);
  }
  
  handleRequest(err, user, info) {
    // Custom error handling
    if (err || !user) {
      // Maybe log failed attempts
      this.logFailedAttempt();
      throw err || new UnauthorizedException();
    }
    return user;
  }
}

Another example of #2-- Here, we'd be taking the AuthGuard built in methods & overriding them 
with our own logic to be activated during execution:

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  // Called to determine if the request should be allowed
  canActivate(context: ExecutionContext) {
    // Add custom logic before authentication
    console.log('Attempting local authentication...');
    return super.canActivate(context);
  }
  
  // Called after Passport processes the request
  handleRequest(err, user, info, context, status) {
    // err: Any error that occurred
    // user: The authenticated user (or false)
    // info: Additional info from Passport
    
    if (err || !user) {
      // Custom error handling
      throw err || new UnauthorizedException('Custom message');
    }
    
    // You could transform the user object here
    return user;
  }
  
  // Extract specific data from the request if needed
  getRequest(context: ExecutionContext) {
    return context.switchToHttp().getRequest();
  }
}

 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') { }