import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { Subscription } from 'rxjs';
import { UserService } from '../user.service';
import { BalancesService } from '../balances.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {

  private userSubs: Subscription;
  private userBalanceSubs: Subscription;
  private contractBalanceSubs: Subscription;
  private contractAllowanceSubs: Subscription;
  
  public isAuthenticated = false;
  public user = '';
  public userBalance = 0;
  public contractBalance = 0;
  public contractAllowance = 0;

  constructor(
    private router: Router,
    private userService: UserService,
    private balancesService: BalancesService
  ) {
    balancesService.refreshContractBalance();

    this.userSubs = userService.authInfo$.subscribe((authInfo) => {
      this.isAuthenticated = authInfo.isAuthenticated;
      this.user = authInfo.user;

      if(this.isAuthenticated) {
        balancesService.refreshUserBalance();
        balancesService.refreshContractAllowance();
      }
    });

    this.userBalanceSubs = balancesService.userBalance$.subscribe((balance) => {
      this.userBalance = balance;
    });

    this.contractBalanceSubs = balancesService.contractBalance$.subscribe((balance) => {
      this.contractBalance = balance;
    });

    this.contractAllowanceSubs = balancesService.contractAllowance$.subscribe((allowance) => {
      this.contractAllowance = allowance;
    });

  }
  ngOnDestroy() {
    this.userSubs.unsubscribe();
  }

  ngOnInit() {
    
  }

  logout() {
    //this.userService.logout();
    //this.router.navigate(['/']);
    window.location.href='/';
  }

  login() {
    window.location.href='/login';
  }

  home() {
    if(this.userService.isAuthenticated()) {
      this.router.navigate(['/bienvenida']);
    } else {
      window.location.href='/';
    }
  }

}
