import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import Web3 from "web3";

@Injectable({
  providedIn: 'root'
})
export class Web3managerService {

  private web3: any;

  constructor() { 
    this.connectWeb3();
  }

  private connectWeb3() {
    this.web3 = new Web3(new Web3.providers.HttpProvider(environment.web3Provider));
    this.web3.eth.handleRevert = true;
  }

  getWeb3Provider() {
    return this.web3;
  }

  getWeb3ProviderInfo(){
    return environment.web3Provider;
  }
  
}
