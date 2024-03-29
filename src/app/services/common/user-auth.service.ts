import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, merge, Observable, tap } from 'rxjs';
import { IAuthToken } from 'src/app/utils/interfaces/iauth-token';
import { IRefreshToken } from 'src/app/utils/interfaces/irefresh-token';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  })
}
  
@Injectable({
  providedIn: 'root'
})
export class UserAuthService {
  private authEndpoint = "http://localhost/cognitalia/api/auth";
  private loggedInUserSubject!: BehaviorSubject<any>;

  constructor(private http:HttpClient) { 
    const isLogged = JSON.parse(localStorage.getItem("loggedInUser") || "{}");
    this.loggedInUserSubject = new BehaviorSubject(Object.keys(isLogged).length == 0 ? false : isLogged);
  }

    public login(user:string, password:string):Observable<any> {   
      const user$ = this.http.post<IAuthToken>(`${this.authEndpoint}/login.php`, {user, password}).pipe(
        tap(res => {
          if (res.state == "success")
            this.setUser(res);
        })
      );

      const refresh$ = this.refreshToken().pipe(
        tap(res => {
          if(res.state == "success") {
            this.setRefreshToken(res);
          }
        })
      );

      const login$ = merge(user$, refresh$);
      return login$;
  }

  public register(username:string, email:string, password:string):Observable<any> {
    const user$ = this.http.post<IAuthToken>(`${this.authEndpoint}/register.php`, {username, email, password}).pipe(
      tap(res => {
        if (res.state == "success") 
          this.setUser(res);
      })
    );

    const refresh$ = this.refreshToken().pipe(
      tap(res => {
        if(res.state == "success")
          this.setRefreshToken(res);
      })
    );

    const register$ = merge(user$, refresh$);
    return register$;
  }

  public refreshToken():Observable<IRefreshToken | IAuthToken> {

    return this.http.post<IRefreshToken>(`${this.authEndpoint}/refresh.php`, {action:"generate"}, httpOptions)
  }

  public refreshSessionToken(username:string = ""):Observable<IAuthToken> {
    return this.http.post<IAuthToken>(`${this.authEndpoint}/refresh.php`, {action:"refresh", username:username}, httpOptions).pipe(
      tap(res => {
        if (res.state == "success")
        console.log("NUEVO TOKEN RECIBIDO CON ÉXITO");
      })
    )
  }

  public logout(): void {
    this.loggedInUserSubject.next(false);
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("refreshToken");
  }

  public getUser(): Observable<IAuthToken> {
    return this.loggedInUserSubject.asObservable();
  }

  public getSessionToken(): IAuthToken {
    const stringifiedToken = localStorage.getItem("loggedInUser");

    return stringifiedToken ? JSON.parse(stringifiedToken) : {};
  }

  public getRefreshToken(): IRefreshToken {
    const stringifiedToken = localStorage.getItem("refreshtoken");

    return stringifiedToken ? JSON.parse(stringifiedToken) : {};
  }

  public setUser(token:IAuthToken):void {
    if(localStorage.getItem("loggedInUser"))
      localStorage.removeItem("loggedInUser");

    localStorage.setItem("loggedInUser", JSON.stringify(token));
    this.loggedInUserSubject.next(token);
  }

  public setRefreshToken(token:IRefreshToken):void {
    if (localStorage.getItem("refreshToken"))
      localStorage.removeItem("refreshToken");
      
    localStorage.setItem("refreshToken", JSON.stringify(token));
  }
}
