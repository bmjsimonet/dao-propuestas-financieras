import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { JjdaoService } from './jjdao.service';
import { Web3managerService } from './web3manager.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private authInfo = new BehaviorSubject<{isAuthenticated: boolean, user: string, reason: string}>({isAuthenticated: false, user: '', reason: ''});
  private userInfo = new BehaviorSubject<{isParticipant: boolean, hasAdminRights: boolean}>({isParticipant: false, hasAdminRights: false});
  
  authInfo$ = this.authInfo.asObservable();
  userInfo$ = this.userInfo.asObservable();

  constructor(
    private web3Manager: Web3managerService,
    private jjdaoService: JjdaoService
  ) { }

  isAuthenticated() {
    return this.authInfo.value.isAuthenticated;
  }

  getUser() {
    return this.authInfo.value.user;
  }

  isParticipant() {
    return this.userInfo.value.isParticipant;
  }

  hasAdminRights() {
    return this.userInfo.value.hasAdminRights;
  }

  login(user: string, password: string) {
    this.web3Manager.getWeb3Provider().eth.personal.unlockAccount(user, password, 0)
    .then((isUnlocked: boolean) => {
      if(isUnlocked) {
        this.authInfo.next({isAuthenticated: true, user: user, reason: 'UNLOCKED'});
      } else {
        console.error('unlockAccount ha terminado pero la cuenta no ha sido desbloqueada');
        this.authInfo.next({isAuthenticated: false, user: '', reason: 'LOCKED'});
      }
    })
    .catch((error: any) => {
      console.error(error);
      this.authInfo.next({isAuthenticated: false, user: '', reason: 'UNLOCK_ERROR'});
    });
  }

  getParticipantInfo() {
    this.jjdaoService.getJJDAO().methods.participants(this.getUser()).call({from: this.getUser()})
    .then((resp: {isParticipant: boolean, hasAdminRights: boolean}) => {
      this.userInfo.next({isParticipant: resp.isParticipant, hasAdminRights: resp.hasAdminRights});
    })
    .catch((error: any) => {
      this.userInfo.next({isParticipant: false, hasAdminRights: false});
      if(error.reason && error.reason === JjdaoService.PARTICIPANT_DOES_NOT_EXIST.error) {
        console.log(JjdaoService.PARTICIPANT_DOES_NOT_EXIST.message);
      } else {
        console.error(error);
      }
    });
  }

  addParticipant() {
    this.jjdaoService.getJJDAO().methods.addParticipant().send({from: this.getUser(), gas: 50000})
    .on('receipt', (receipt: any) => {
      if(receipt.events.ParticipantAdded) {
        this.userInfo.next({isParticipant: true, hasAdminRights: false});
      } else {
        alert('Evento no esperado, ver logs');
        console.log(receipt);
      }
    })
    .on('error', (error: any, receipt: any) => {
      this.userInfo.next({isParticipant: false, hasAdminRights: false});
      if(error.reason && error.reason === JjdaoService.PARTICIPANT_ALREADY_EXISTS.error) {
        alert(JjdaoService.PARTICIPANT_ALREADY_EXISTS.message);
      } else {
        console.error(error);
      }
    });
  }
}
