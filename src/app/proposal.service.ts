import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { JjdaoService } from './jjdao.service';
import { UserService } from './user.service';
import { Web3managerService } from './web3manager.service';
import { BalancesService } from './balances.service';

export interface VotingProcess {
  id: number,
  startDate: Date,
  endDate: Date,
  isEnabled: boolean,
  reason: string
}

export enum Status {
  PENDIENTE,
  APROBADA,
  RETIRADA
}

export interface Proposal {
  id: number,
  votingProcessId: number,
  requiredTokenAmount: number,
  tokenCount: number,
  voteCount: number,
  status: Status,
  description: string,
  proposer: string,
  managementContract: string,
  voters: string[]
}

@Injectable({
  providedIn: 'root'
})
export class ProposalService {

  constructor(
    private userService: UserService,
    private jjdaoService: JjdaoService,
    private web3Service: Web3managerService,
    private balancesService: BalancesService
  ) { }

  private refreshBalances() {
    this.balancesService.refreshUserBalance();
    this.balancesService.refreshContractBalance();
    this.balancesService.refreshContractAllowance();
  }

  getVotingProcess(vps: BehaviorSubject<VotingProcess>) {
    this.jjdaoService.getJJDAO().methods.getVotingProcess().call({from: this.userService.getUser()})
      .then((resp: {id: number, startDate: number, endDate: number, isEnabled: boolean}) => {
        vps.next({
          id: resp.id,
          startDate: new Date(resp.startDate * 1000),
          endDate: new Date(resp.endDate * 1000),
          isEnabled: resp.isEnabled,
          reason: ''
        });
      })
      .catch((error: any) => {
        vps.next({
          id: 0,
          startDate: new Date(0),
          endDate: new Date(0),
          isEnabled: false,
          reason: ''
        });
        console.error(error);
      });
  }

  startVotingProcess(vps: BehaviorSubject<VotingProcess>, startDateUnixTimestamp: number, endDateUnixTimestamp: number) {
    this.jjdaoService.getJJDAO().methods.startVotingProcess(startDateUnixTimestamp, endDateUnixTimestamp).send({from: this.userService.getUser(), gas: 200000})
    .on('receipt', (receipt: any) => {
      if(receipt.events.InicioVotacion) {
        vps.next({
          id: receipt.events.InicioVotacion.returnValues.id,
          startDate: new Date(startDateUnixTimestamp * 1000),
          endDate: new Date(endDateUnixTimestamp * 1000),
          isEnabled: true,
          reason: ''
        });
      } else {
        alert('Evento no esperado, ver logs');
        console.log(receipt);
      }
    })
    .on('error', (error: any, receipt: any) => {
      let reason;
      if(error.reason && error.reason === JjdaoService.ONGOING_VOTING_PROCESS.error) {
        reason = JjdaoService.ONGOING_VOTING_PROCESS.message;
      }
      else if(error.reason && error.reason === JjdaoService.INCOHERENT_DATE_RANGE.error) {
        reason = JjdaoService.INCOHERENT_DATE_RANGE.message;
      }
      else if(error.reason && error.reason === JjdaoService.PAST_START_DATE.error) {
        reason = JjdaoService.PAST_START_DATE.message;
      }
      else if(error.reason && error.reason === JjdaoService.VOTING_PROCESS_ENDED.error) {
        reason = JjdaoService.VOTING_PROCESS_ENDED.message;
      } else {
        reason = 'Error desconocido, ver logs';
        console.error(error);
      }
      vps.next({
        id: vps.value.id,
        startDate: vps.value.startDate,
        endDate: vps.value.endDate,
        isEnabled: false,
        reason: reason
      });
    });
  }

  endVotingProcess(vps: BehaviorSubject<VotingProcess>) {
    this.jjdaoService.getJJDAO().methods.endVotingProcess().send({from: this.userService.getUser(), gas: 200000})
    .on('receipt', (receipt: any) => {
      if(receipt.events.FinVotacion) {
        vps.next({
          id: vps.value.id,
          startDate: vps.value.startDate,
          endDate: vps.value.endDate,
          isEnabled: false,
          reason: ''
        });
      } else {
        alert('Evento no esperado, ver logs');
        console.log(receipt);
      }
    })
    .on('error', (error: any, receipt: any) => {
      let reason;
      if(error.reason && error.reason === JjdaoService.ONGOING_VOTING_PROCESS.error) {
        reason = JjdaoService.ONGOING_VOTING_PROCESS.message;
      }
      else if(error.reason && error.reason === JjdaoService.VOTING_PROCESS_ENDED.error) {
        reason = JjdaoService.VOTING_PROCESS_ENDED.message;
      } else {
        reason = 'Error desconocido, ver logs';
        console.error(error);
      }
      vps.next({
        id: vps.value.id,
        startDate: vps.value.startDate,
        endDate: vps.value.endDate,
        isEnabled: vps.value.isEnabled,
        reason: reason
      });
    });
  }

  getProposals(ps: BehaviorSubject<{proposals: Proposal[], reason: string}>) {
    this.jjdaoService.getJJDAO().methods.getProposals().call({from: this.userService.getUser()})
    .then((resp: Proposal[]) => {
      let proposalsTransformed: Proposal[];
      ps.next({
        proposals: resp.map((proposal) => {
          return {
            id: proposal.id,
            votingProcessId: proposal.votingProcessId,
            requiredTokenAmount: proposal.requiredTokenAmount,
            tokenCount: proposal.tokenCount,
            voteCount: proposal.voteCount,
            status: proposal.status,
            description: this.web3Service.getWeb3Provider().utils.hexToUtf8(proposal.description),
            proposer: proposal.proposer,
            managementContract: proposal.managementContract,
            voters: proposal.voters
          }
        }),
        reason: ''
      });
    })
    .catch((error: any) => {
      ps.next({
        proposals: [],
        reason: ''
      });
      console.error(error);
    });
  }

  createProposal(pcs: BehaviorSubject<{change: boolean, id: number, reason: string}>, description: string, requiredTokenAmount: number, managementContract: string) {
    this.jjdaoService.getJJDAO().methods.createProposal(this.web3Service.getWeb3Provider().utils.utf8ToHex(description), requiredTokenAmount, managementContract).send({from: this.userService.getUser(), gas: 200000})
    .on('receipt', (receipt: any) => {
      if(receipt.events.NuevaPropuesta) {
        pcs.next({change: true, id: receipt.events.NuevaPropuesta.returnValues.id, reason: ''});
      } else {
        alert('Evento no esperado, ver logs');
        console.log(receipt);
      }
    })
    .on('error', (error: any, receipt: any) => {
      let reason;
      if(error.reason && error.reason === JjdaoService.MUST_BE_PARTICIPANT.error) {
        reason = JjdaoService.MUST_BE_PARTICIPANT.message;
      }
      else if(error.reason && error.reason === JjdaoService.THERE_MUST_BE_VOTING_PROCESS.error) {
        reason = JjdaoService.THERE_MUST_BE_VOTING_PROCESS.message;
      }
      else if(error.reason && error.reason === JjdaoService.VOTING_PROCESS_MUST_HAVE_STARTED.error) {
        reason = JjdaoService.VOTING_PROCESS_MUST_HAVE_STARTED.message;
      }
      else if(error.reason && error.reason === JjdaoService.VOTING_PROCESS_MUST_NOT_HAVE_FINISHED.error) {
        reason = JjdaoService.VOTING_PROCESS_MUST_NOT_HAVE_FINISHED.message;
      } else if(error.reason && error.reason === JjdaoService.REQUIRED_TOKEN_AMOUNT_MUST_BE_GREATER_THAN_0.error) {
        reason = JjdaoService.REQUIRED_TOKEN_AMOUNT_MUST_BE_GREATER_THAN_0.message;
      } else if(error.reason && error.reason === JjdaoService.ADDRESS_MUST_BE_A_CONTRACT.error) {
        reason = JjdaoService.ADDRESS_MUST_BE_A_CONTRACT.message;
      } else {
        reason = 'Error desconocido, ver logs';
        console.error(error);
      }
      pcs.next({change: false, id: 0, reason: reason});
    });
  }

  voteProposal(vcs: BehaviorSubject<{change: boolean, reason: string}>, id: number, votes: number) {
    this.jjdaoService.getJJDAO().methods.voteProposal(id, votes).send({from: this.userService.getUser(), gas: 200000})
    .on('receipt', (receipt: any) => {
      if(receipt.events.PropuestaVotada) {
        vcs.next({change: true, reason: ''});
      } else {
        alert('Evento no esperado, ver logs');
        console.log(receipt);
      }
      this.refreshBalances();
    })
    .on('error', (error: any, receipt: any) => {
      let reason;
      if(error.reason && error.reason === JjdaoService.MUST_BE_PARTICIPANT.error) {
        reason = JjdaoService.MUST_BE_PARTICIPANT.message;
      }
      else if(error.reason && error.reason === JjdaoService.THERE_MUST_BE_VOTING_PROCESS.error) {
        reason = JjdaoService.THERE_MUST_BE_VOTING_PROCESS.message;
      }
      else if(error.reason && error.reason === JjdaoService.VOTING_PROCESS_MUST_HAVE_STARTED.error) {
        reason = JjdaoService.VOTING_PROCESS_MUST_HAVE_STARTED.message;
      }
      else if(error.reason && error.reason === JjdaoService.VOTING_PROCESS_MUST_NOT_HAVE_FINISHED.error) {
        reason = JjdaoService.VOTING_PROCESS_MUST_NOT_HAVE_FINISHED.message;
      } else if(error.reason && error.reason === JjdaoService.CONCURRENCY_NOT_ALLOWED.error) {
        reason = JjdaoService.CONCURRENCY_NOT_ALLOWED.message;
      } else if(error.reason && error.reason === JjdaoService.INVALID_PROPOSAL_ID.error) {
        reason = JjdaoService.INVALID_PROPOSAL_ID.message;
      } else if(error.reason && error.reason === JjdaoService.PROPOSAL_MUST_BE_PENDING.error) {
        reason = JjdaoService.PROPOSAL_MUST_BE_PENDING.message;
      } else if(error.reason && error.reason === JjdaoService.PROPOSAL_MUST_BE_CREATED_IN_THIS_VOTING_PROCESS.error) {
        reason = JjdaoService.PROPOSAL_MUST_BE_CREATED_IN_THIS_VOTING_PROCESS.message;
      } else if(error.reason && error.reason === JjdaoService.VOTES_MUST_BE_GREATER_THAN_0.error) {
        reason = JjdaoService.VOTES_MUST_BE_GREATER_THAN_0.message;
      } else if(error.reason && error.reason === JjdaoService.VOTER_DOESNT_HAVE_ENOUGH_BALANCE.error) {
        reason = JjdaoService.VOTER_DOESNT_HAVE_ENOUGH_BALANCE.message;
      } else if(error.reason && error.reason === JjdaoService.PLATFORM_DOESNT_HAVE_ENOUGH_BALANCE.error) {
        reason = JjdaoService.PLATFORM_DOESNT_HAVE_ENOUGH_BALANCE.message;
      } else {
        reason = 'Error desconocido, ver logs';
        console.error(error);
      }
      vcs.next({change: false, reason: reason});
    });
  }

  retireProposal(rcs: BehaviorSubject<{change: boolean, reason: string}>, id: number) {
    this.jjdaoService.getJJDAO().methods.retireProposal(id).send({from: this.userService.getUser(), gas: 200000})
    .on('receipt', (receipt: any) => {
      if(receipt.events.PropuestaRetirada) {
        rcs.next({change: true, reason: ''});
      } else {
        alert('Evento no esperado, ver logs');
        console.log(receipt);
      }
      this.refreshBalances();
    })
    .on('error', (error: any, receipt: any) => {
      let reason;
      if(error.reason && error.reason === JjdaoService.MUST_BE_PARTICIPANT.error) {
        reason = JjdaoService.MUST_BE_PARTICIPANT.message;
      } else if(error.reason && error.reason === JjdaoService.CONCURRENCY_NOT_ALLOWED.error) {
        reason = JjdaoService.CONCURRENCY_NOT_ALLOWED.message;
      } else if(error.reason && error.reason === JjdaoService.INVALID_PROPOSAL_ID.error) {
        reason = JjdaoService.INVALID_PROPOSAL_ID.message;
      } else if(error.reason && error.reason === JjdaoService.PROPOSAL_MUST_BE_PENDING.error) {
        reason = JjdaoService.PROPOSAL_MUST_BE_PENDING.message;
      } else if(error.reason && error.reason === JjdaoService.CALLER_MUST_BE_PROPOSER.error) {
        reason = JjdaoService.CALLER_MUST_BE_PROPOSER.message;
      } else {
        reason = 'Error desconocido, ver logs';
        console.error(error);
      }
      rcs.next({change: false, reason: reason});
    });
  }

  getVotesByParticipantByProposal(vbpbps: BehaviorSubject<{votes: number, reason: string}>, proposal: number, user: string) {
    this.jjdaoService.getJJDAO().methods.votesByParticipantByProposal(proposal-1, user).call({from: this.userService.getUser()})
    .then((resp: number) => {
      vbpbps.next({
        votes: resp,
        reason: ''
      });
    })
    .catch((error: any) => {
      vbpbps.next({
        votes: 0,
        reason: 'Error, ver logs'
      });
      console.error(error);
    });
  }
}
