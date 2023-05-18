import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { JjdaoService } from '../jjdao.service';
import { Web3managerService } from '../web3manager.service';
import { FormControl, FormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { UserService } from '../user.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {

  private userSubs: Subscription;
  
  public loginForm: FormGroup;
  public thinking = false;

  constructor(
    private router: Router,
    private web3Manager: Web3managerService,
    private userService: UserService
  ) {
    this.loginForm = new FormGroup({
      user: new FormControl('', [Validators.required, this.ethAddressValidator()]),
      pass: new FormControl('')
    });

    this.userSubs = userService.authInfo$.subscribe((authInfo) => {
      this.thinking = false;
      if(authInfo.isAuthenticated) {
        this.router.navigate(['/bienvenida']);
      } else {
        if(authInfo.reason) {
          switch(authInfo.reason) {
            case 'UNLOCK_ERROR': {
              alert('La contraseña es incorrecta');
              break;
            }
            case 'LOGOUT': {
              break;
            }
            default: {
              alert(`Se ha producido el error: ${authInfo.reason}`);
              break;
            }
          }
        }
      }
    });
   }

  ngOnDestroy() {
    this.userSubs.unsubscribe();
  }

  ngOnInit() {
    
  }

  login() {
    this.thinking = true;
    let user = this.loginForm.value.user;
    let password = this.loginForm.value.pass;
    this.userService.login(user, password);
  }

  public myError = (controlName: string, errorName: string) => {
    return this.loginForm.controls[controlName].hasError(errorName);
  }

  ethAddressValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      return !this.web3Manager.getWeb3Provider().utils.isAddress(control.value) ? {invalidAddress: {value: control.value}} : null;
    };
  }

  get user() { return this.loginForm.get('user'); }
  get pass() { return this.loginForm.get('pass'); }

}