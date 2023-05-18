import { Injectable } from '@angular/core';
import { JjtokenService } from './jjtoken.service';
import { UserService } from './user.service';
import { JjdaoService } from './jjdao.service';
import { BehaviorSubject } from 'rxjs';

export interface BalanceAndAllowance {
  balance: number,
  allowance: number,
  reason: string
}

@Injectable({
  providedIn: 'root'
})
export class BalancesService {

  private userBalance = new BehaviorSubject<number>(0);
  private contractBalance = new BehaviorSubject<number>(0);
  private contractAllowance = new BehaviorSubject<number>(0);

  userBalance$ = this.userBalance.asObservable();
  contractBalance$ = this.contractBalance.asObservable();
  contractAllowance$ = this.contractAllowance.asObservable();

  constructor(
    private jjtokenService: JjtokenService,
    private userService: UserService,
    private jjdaoService: JjdaoService
  ) { }

  refreshUserBalance() {
    this.jjtokenService.getJJtoken().methods.balanceOf(this.userService.getUser()).call({from: this.userService.getUser()})
      .then((balance: number) => {
        this.userBalance.next(balance);
      })
      .catch((error: any) => {

        console.error(error);
      });
  }

  refreshContractBalance() {
    this.jjtokenService.getJJtoken().methods.balanceOf(this.jjdaoService.getContractAddress()).call({from: this.userService.getUser()})
      .then((balance: number) => {
        this.contractBalance.next(balance);
      })
      .catch((error: any) => {

        console.error(error);
      });
  }

  refreshContractAllowance() {
    this.jjtokenService.getJJtoken().methods.allowance(this.userService.getUser(), this.jjdaoService.getContractAddress()).call({from: this.userService.getUser()})
      .then((allowance: number) => {
        this.contractAllowance.next(allowance);
      })
      .catch((error: any) => {

        console.error(error);
      });
  }
}
