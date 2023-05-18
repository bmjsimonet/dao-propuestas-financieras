import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { DatePipe } from '@angular/common';
import {MatDialog, MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatSnackBar, MAT_SNACK_BAR_DATA} from '@angular/material/snack-bar';
import { JjdaoService } from '../jjdao.service';
import { UserService } from '../user.service';
import { BalancesService } from '../balances.service';
import { Web3managerService } from '../web3manager.service';
import { ProposalService, VotingProcess, Proposal, Status } from '../proposal.service';

export interface VotingProcessDialogData {
  startDate: Date;
  endDate: Date;
}

export interface ProposalDialogData {
  description: string,
  requiredTokenAmount: number,
  managementContract: string
}

export interface VoteDialogData {
  id: number,
  name: string,
  voter: string,
  votes: number,
  tokens: number,
  currentTokens: number
}

export interface RetireDialogData {
  id: number,
  name: string,
  tokens: number,
  votes: number
}

export enum ProposalsFilter {
  ALL,
  CURRENT,
  MY
}

@Component({
  selector: 'app-propuestas',
  templateUrl: './propuestas.component.html',
  styleUrls: ['./propuestas.component.css']
})
export class PropuestasComponent implements OnInit, OnDestroy {

  public user = '0x0';
  public isAuthenticated = false;
  public isParticipant = false;
  public hasAdminRights = false;

  private votingProcess = new BehaviorSubject<VotingProcess>({id: 0, startDate: new Date(0), endDate: new Date(0), isEnabled: false, reason: ''});
  public votingProcess$ = this.votingProcess.asObservable();
  private votingProcessSubs: Subscription = new Subscription;

  private proposals = new BehaviorSubject<{proposals: Proposal[], reason: string}>({proposals: [], reason: ''});
  public proposalsView: Proposal[] = [];
  private proposalsSubs: Subscription = new Subscription;

  public proposalsForm: FormGroup;

  public proposalsFilter: ProposalsFilter = ProposalsFilter.ALL;

  public voteThinking = false;
  public proposalsThinking = false;

  readonly Status = Status;
  readonly ProposalsFilter = ProposalsFilter;

  constructor(
    private userService: UserService,
    private proposalService: ProposalService,
    private jjdaoService: JjdaoService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {

    this.proposalsForm = new FormGroup({
      proposalsFilter: new FormControl<ProposalsFilter>(ProposalsFilter.ALL)
    });

    this.user = userService.getUser();
    this.isAuthenticated = userService.isAuthenticated();

    if(this.isAuthenticated) {
      this.voteThinking = true;
      this.proposalsThinking = true;

      this.jjdaoService.getJJDAO().methods.participants(this.user).call({from: this.user})
      .then((resp: {isParticipant: boolean, hasAdminRights: boolean}) => {
        this.isParticipant = resp.isParticipant;
        this.hasAdminRights = resp.hasAdminRights;
      })
      .catch((error: any) => {
        this.isParticipant = false;
        this.hasAdminRights = false;
        if(error.reason && error.reason === JjdaoService.PARTICIPANT_DOES_NOT_EXIST.error) {
          console.log(JjdaoService.PARTICIPANT_DOES_NOT_EXIST.message);
        } else {
          console.error(error);
        }
      });

      //Subscripciones
      this.votingProcessSubs = this.votingProcess$.subscribe((votingProcess) => {
        this.voteThinking = false;
        if(votingProcess.reason !== '') {
          alert(votingProcess.reason);
        }
        this.aplicarFiltro();
      });

      this.proposalsSubs = this.proposals.subscribe((proposalsStatus) => {
        this.proposalsThinking = false;
        this.aplicarFiltro();
      });

      //OBTENER PROCESO VOTACION
      this.proposalService.getVotingProcess(this.votingProcess);

      //OBTENER PROPUESTAS
      this.proposalService.getProposals(this.proposals);

    }
    
  }

  ngOnInit() {
  }

  ngOnDestroy(): void {
    this.votingProcessSubs.unsubscribe();
    this.proposalsSubs.unsubscribe();
  }

  openVotingProcessDialog(): void {
    const dialogRef = this.dialog.open(VotingProcessDialog, {
      data: {
        startDate: new DatePipe('es-ES').transform(this.votingProcess.value.startDate, 'yyyy/MM/dd HH:mm'),
        endDate: new DatePipe('es-ES').transform(this.votingProcess.value.endDate, 'yyyy/MM/dd HH:mm')
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result) {
        this.voteThinking = true;
        this.proposalService.startVotingProcess(
          this.votingProcess,
          Math.floor(new Date(result.startDate).getTime() / 1000),
          Math.floor(new Date(result.endDate).getTime() / 1000)
        );
      }
    });
  }

  finalizarVotacion() {
    this.voteThinking = true;
    this.proposalService.endVotingProcess(this.votingProcess);
  }

  obtenerPropuestas() {
    this.proposalsThinking = true;
    this.proposalService.getProposals(this.proposals);
  }

  aplicarFiltro() {
    let filter: ProposalsFilter = this.proposalsForm.value.proposalsFilter;
    if(filter == ProposalsFilter.ALL) {
      this.proposalsView = this.proposals.value.proposals;
    }
    else if(filter == ProposalsFilter.CURRENT) {
      this.proposalsView = this.proposals.value.proposals.filter(proposal => {return proposal.votingProcessId === this.votingProcess.value.id;});
    }
    else {
      this.proposalsView = this.proposals.value.proposals.filter(proposal => {return proposal.proposer === this.user;});
    }
  }

  openProposalDialog(): void {
    const dialogRef = this.dialog.open(ProposalDialog, {
      data: {
        description: '',
        requiredTokenAmount: 0,
        managementContract: ''
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result) {
        this.snackBar.openFromComponent(Snackbar, {
          duration: 3 * 1000,
          verticalPosition: 'top',
          panelClass: ['snackbar'],
          data: 'Propuesta creada con id: '+result.id
        });
        this.obtenerPropuestas();
      }
    });
  }

  openVoteDialog(id: number, name: string, voter: string, votes: number, tokens: number, currentTokens: number): void {
    const dialogRef = this.dialog.open(VoteDialog, {
      data: {
        id: id,
        name: name,
        voter: voter,
        votes: votes,
        tokens: tokens,
        currentTokens: currentTokens
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result) {
        this.snackBar.openFromComponent(Snackbar, {
          duration: 3 * 1000,
          verticalPosition: 'top',
          panelClass: ['snackbar'],
          data: 'Propuesta votada correctamente'
        });
        this.obtenerPropuestas();
      }
    });
  }

  openRetireDialog(id: number, name: string, tokens: number, votes: number): void {
    const dialogRef = this.dialog.open(RetireDialog, {
      data: {
        id: id,
        name: name,
        tokens: tokens,
        votes: votes
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result) {
        this.snackBar.openFromComponent(Snackbar, {
          duration: 3 * 1000,
          verticalPosition: 'top',
          panelClass: ['snackbar'],
          data: 'Propuesta retirada correctamente'
        });
        this.obtenerPropuestas();
      }
    });
  }

}


//Dialogos

@Component({
  selector: 'propuestas-voting-process-dialog',
  templateUrl: 'propuestas-voting-process-dialog.html',
})
export class VotingProcessDialog {
  constructor(
    public dialogRef: MatDialogRef<VotingProcessDialog>,
    @Inject(MAT_DIALOG_DATA) public data: VotingProcessDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }
}

@Component({
  selector: 'propuestas-proposal-dialog',
  templateUrl: 'propuestas-proposal-dialog.html',
  styleUrls: ['./propuestas.component.css']
})
export class ProposalDialog {

  public proposalForm: FormGroup;
  public proposalThinking = false;
  private proposalChange = new BehaviorSubject<{change: boolean, id: number, reason: string}>({change: false, id: 0, reason: ''});
  private proposalChangeSubs: Subscription = new Subscription;

  constructor(
    public dialogRef: MatDialogRef<ProposalDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ProposalDialogData,
    private web3Manager: Web3managerService,
    private proposalService: ProposalService
  ) {
    this.proposalForm = new FormGroup({
      description: new FormControl('', [Validators.required]),
      requiredTokenAmount: new FormControl('', [Validators.required, this.numberGreaterZeroValidator()]),
      managementContract: new FormControl('', [Validators.required, this.ethAddressValidator()])
    });

    this.proposalChangeSubs = this.proposalChange.subscribe((proposalChange) => {
      this.proposalThinking = false;
      
      if(proposalChange.reason !== '') {
        alert(proposalChange.reason);
      }
      if(proposalChange.change) {
        this.dialogRef.close({id: proposalChange.id, description: this.proposalForm.value.description, requiredTokenAmount: this.proposalForm.value.requiredTokenAmount, managementContract: this.proposalForm.value.managementContract});
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onOK(): void {
    this.proposalThinking = true;

    this.proposalService.createProposal(
      this.proposalChange,
      this.proposalForm.value.description,
      this.proposalForm.value.requiredTokenAmount,
      this.proposalForm.value.managementContract
    );
  }

  validate() {
    if(this.proposalForm.valid) {
      this.onOK();
    }
  }

  public myError = (controlName: string, errorName: string) => {
    return this.proposalForm.controls[controlName].hasError(errorName);
  }

  ethAddressValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      return !this.web3Manager.getWeb3Provider().utils.isAddress(control.value) ? {invalidAddress: {value: control.value}} : null;
    };
  }

  numberGreaterZeroValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      return control.value <= 0 ? {invalidNumber: {value: control.value}} : null;
    };
  }

  get description() { return this.proposalForm.get('description'); }
  get requiredTokenAmount() { return this.proposalForm.get('requiredTokenAmount'); }
  get managementContract() { return this.proposalForm.get('managementContract'); }

  getProposalThinking() { return this.proposalThinking; }
  setProposalThinking(state: boolean) { this.proposalThinking = state; }

  ngOnDestroy(): void {
    this.proposalChangeSubs.unsubscribe();
  }
}

@Component({
  selector: 'propuestas-vote-dialog',
  templateUrl: 'propuestas-vote-dialog.html',
  styleUrls: ['./propuestas-vote-dialog.css']
})
export class VoteDialog {

  public voteForm: FormGroup;
  public voteThinking = false;
  private voteChange = new BehaviorSubject<{change: boolean, reason: string}>({change: false, reason: ''});
  private voteChangeSubs: Subscription = new Subscription;

  private userBalanceSubs: Subscription;
  private contractBalanceSubs: Subscription;
  private contractAllowanceSubs: Subscription;
  
  public userBalance = 0;
  public contractBalance = 0;
  public contractAllowance = 0;
  
  private votesByParticipantByProposal = new BehaviorSubject<{votes: number, reason: string}>({votes: 0, reason: ''});
  public votesByParticipantByProposal$ = this.votesByParticipantByProposal.asObservable();
  private votesByParticipantByProposalSubs: Subscription = new Subscription;
  

  constructor(
    public dialogRef: MatDialogRef<VoteDialog>,
    @Inject(MAT_DIALOG_DATA) public data: VoteDialogData,
    private proposalService: ProposalService,
    private balancesService: BalancesService
  ) {
    this.voteForm = new FormGroup({
      votes: new FormControl('', [Validators.required, this.numberGreaterZeroValidator()]),
      tokens: new FormControl({value: 0, disabled: true}, [Validators.required, this.numberGreaterZeroValidator()])
    });

    this.voteChangeSubs = this.voteChange.subscribe((voteChange) => {
      this.voteThinking = false;
      
      if(voteChange.reason !== '') {
        alert(voteChange.reason);
      }
      if(voteChange.change) {
        this.dialogRef.close({votes: this.voteForm.value.votes, tokens: this.voteForm.value.tokens});
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

    /*
    this.votesByParticipantByProposalSubs = this.votesByParticipantByProposal$.subscribe((votesByParticipantByProposal) => {

    });
    */

    this.proposalService.getVotesByParticipantByProposal(this.votesByParticipantByProposal, this.data.id, this.data.voter);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onOK(): void {
    this.voteThinking = true;

    this.proposalService.voteProposal(
      this.voteChange,
      this.data.id,
      this.voteForm.value.votes
    );
  }

  validate() {
    if(this.voteForm.valid) {
      this.onOK();
    }
  }

  votesChange() {
    let tokens = 0;
    if(this.voteForm.value.votes > 0) {
      tokens = (+this.voteForm.value.votes + +this.votesByParticipantByProposal.value.votes) ** 2 - (+this.votesByParticipantByProposal.value.votes) ** 2;
    }
    this.voteForm.patchValue({tokens: tokens});
  }

  public myError = (controlName: string, errorName: string) => {
    return this.voteForm.controls[controlName].hasError(errorName);
  }

  numberGreaterZeroValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      return control.value <= 0 ? {invalidNumber: {value: control.value}} : null;
    };
  }

  get votes() { return this.voteForm.get('votes'); }
  get tokens() { return this.voteForm.get('tokens'); }

  ngOnDestroy(): void {
    this.voteChangeSubs.unsubscribe();
  }
}

@Component({
  selector: 'propuestas-retire-dialog',
  templateUrl: 'propuestas-retire-dialog.html',
  styleUrls: ['./propuestas-retire-dialog.css']
})
export class RetireDialog {

  public retireThinking = false;
  private retireChange = new BehaviorSubject<{change: boolean, reason: string}>({change: false, reason: ''});
  private retireChangeSubs: Subscription = new Subscription;

  constructor(
    public dialogRef: MatDialogRef<RetireDialog>,
    @Inject(MAT_DIALOG_DATA) public data: RetireDialogData,
    private proposalService: ProposalService
  ) {

    this.retireChangeSubs = this.retireChange.subscribe((retireChange) => {
      this.retireThinking = false;
      
      if(retireChange.reason !== '') {
        alert(retireChange.reason);
      }
      if(retireChange.change) {
        this.dialogRef.close({retired: true});
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onOK(): void {
    this.retireThinking = true;

    this.proposalService.retireProposal(
      this.retireChange,
      this.data.id
    );
  }

  ngOnDestroy(): void {
    this.retireChangeSubs.unsubscribe();
  }
}

//Snackbar

@Component({
  selector: 'propuestas-snackbar',
  templateUrl: 'propuestas-snackbar.html',
  styleUrls: ['./propuestas-snackbar.css']
})
export class Snackbar {
  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: string) { }
}