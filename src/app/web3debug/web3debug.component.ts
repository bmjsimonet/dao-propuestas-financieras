import { Component, OnInit } from '@angular/core';
import { JjdaoService } from '../jjdao.service';
import { Web3managerService } from '../web3manager.service';


@Component({
  selector: 'app-web3debug',
  templateUrl: './web3debug.component.html',
  styleUrls: ['./web3debug.component.css']
})
export class Web3debugComponent implements OnInit {

  account: string = "0x0";
  web3ProviderName: string;
  jjdaoAddress: string;
  chainId = 0;
  nodeInfo = '';

  constructor(
    private jjdaoService: JjdaoService,
    private web3Manager: Web3managerService
  ) {
    this.web3ProviderName = web3Manager.getWeb3ProviderInfo();
    this.jjdaoAddress = jjdaoService.getContractAddress();
    
   }

  ngOnInit() {
    this.web3Manager.getWeb3Provider().eth.getChainId()
    .then((chainId: number) => { this.chainId = chainId; });

    this.web3Manager.getWeb3Provider().eth.getNodeInfo()
    .then((nodeInfo: string) => { this.nodeInfo = nodeInfo; });
  }

}
