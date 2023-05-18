import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { Web3managerService } from './web3manager.service';

@Injectable({
  providedIn: 'root'
})
export class JjdaoService {

  private ABI = [{"inputs":[],"name":"addParticipant","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"description","type":"bytes32"},{"internalType":"uint32","name":"requiredTokenAmount","type":"uint32"},{"internalType":"contract IExecutableProposal","name":"managementContract","type":"address"}],"name":"createProposal","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"endVotingProcess","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"jjTokenContractAddress","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint64","name":"id","type":"uint64"}],"name":"FinVotacion","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint64","name":"id","type":"uint64"},{"indexed":true,"internalType":"uint32","name":"startDate","type":"uint32"},{"indexed":true,"internalType":"uint32","name":"endDate","type":"uint32"}],"name":"InicioVotacion","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint64","name":"id","type":"uint64"},{"indexed":true,"internalType":"address","name":"proposer","type":"address"},{"indexed":true,"internalType":"bytes32","name":"description","type":"bytes32"},{"indexed":false,"internalType":"uint32","name":"requiredTokenAmount","type":"uint32"}],"name":"NuevaPropuesta","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"participant","type":"address"}],"name":"ParticipantAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint64","name":"id","type":"uint64"},{"indexed":true,"internalType":"uint16","name":"voteCount","type":"uint16"},{"indexed":true,"internalType":"uint32","name":"tokenCount","type":"uint32"}],"name":"PropuestaAprobada","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint64","name":"id","type":"uint64"}],"name":"PropuestaRetirada","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint64","name":"id","type":"uint64"},{"indexed":true,"internalType":"address","name":"voter","type":"address"},{"indexed":true,"internalType":"uint16","name":"votes","type":"uint16"}],"name":"PropuestaVotada","type":"event"},{"inputs":[{"internalType":"uint64","name":"id","type":"uint64"}],"name":"retireProposal","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint32","name":"startDate","type":"uint32"},{"internalType":"uint32","name":"endDate","type":"uint32"}],"name":"startVotingProcess","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint64","name":"id","type":"uint64"},{"internalType":"uint16","name":"votes","type":"uint16"}],"name":"voteProposal","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getProposals","outputs":[{"components":[{"internalType":"uint64","name":"id","type":"uint64"},{"internalType":"uint64","name":"votingProcessId","type":"uint64"},{"internalType":"uint32","name":"requiredTokenAmount","type":"uint32"},{"internalType":"uint32","name":"tokenCount","type":"uint32"},{"internalType":"uint16","name":"voteCount","type":"uint16"},{"internalType":"enum JJDAO.Status","name":"status","type":"uint8"},{"internalType":"bytes32","name":"description","type":"bytes32"},{"internalType":"address","name":"proposer","type":"address"},{"internalType":"contract IExecutableProposal","name":"managementContract","type":"address"},{"internalType":"address[]","name":"voters","type":"address[]"}],"internalType":"struct JJDAO.Proposal[]","name":"","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getVotingProcess","outputs":[{"internalType":"uint64","name":"id","type":"uint64"},{"internalType":"uint32","name":"startDate","type":"uint32"},{"internalType":"uint32","name":"endDate","type":"uint32"},{"internalType":"bool","name":"isEnabled","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"jjToken","outputs":[{"internalType":"contract JJToken","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"participants","outputs":[{"internalType":"bool","name":"isParticipant","type":"bool"},{"internalType":"bool","name":"hasAdminRights","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"proposals","outputs":[{"internalType":"uint64","name":"id","type":"uint64"},{"internalType":"uint64","name":"votingProcessId","type":"uint64"},{"internalType":"uint32","name":"requiredTokenAmount","type":"uint32"},{"internalType":"uint32","name":"tokenCount","type":"uint32"},{"internalType":"uint16","name":"voteCount","type":"uint16"},{"internalType":"enum JJDAO.Status","name":"status","type":"uint8"},{"internalType":"bytes32","name":"description","type":"bytes32"},{"internalType":"address","name":"proposer","type":"address"},{"internalType":"contract IExecutableProposal","name":"managementContract","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint64","name":"","type":"uint64"},{"internalType":"address","name":"","type":"address"}],"name":"votesByParticipantByProposal","outputs":[{"internalType":"uint16","name":"","type":"uint16"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"votingProcess","outputs":[{"internalType":"uint64","name":"id","type":"uint64"},{"internalType":"uint32","name":"startDate","type":"uint32"},{"internalType":"uint32","name":"endDate","type":"uint32"},{"internalType":"bool","name":"isEnabled","type":"bool"}],"stateMutability":"view","type":"function"}];
  private contractAddress = environment.jjdaoAddress;
  private jjdao: any;

  public static readonly PARTICIPANT_ALREADY_EXISTS = {
    error: 'Participant already exists',
    message: 'Esta dirección ya es participante'
  };

  public static readonly PARTICIPANT_DOES_NOT_EXIST = {
    error: 'Participant does not exist',
    message: 'Esta dirección no es participante, debe registrarse'
  };

  public static readonly ONGOING_VOTING_PROCESS = {
    error: 'Ongoing voting process',
    message: 'Hay un proceso de votación activo'
  }

  public static readonly INCOHERENT_DATE_RANGE = {
    error: 'End date must be strictly higher than start date',
    message: 'La fecha de fin debe ser estrictamente mayor que la fecha de inicio'
  }

  public static readonly PAST_START_DATE = {
    error: 'Start date must be a future date',
    message: 'La fecha de inicio debe ser una fecha futura'
  }

  public static readonly VOTING_PROCESS_ENDED = {
    error: 'Voting process already ended by admin',
    message: 'El proceso de votación ya ha sido finalizado por el admin'
  }

  public static readonly MUST_BE_PARTICIPANT = {
    error: 'Caller must be a participant',
    message: 'La dirección debe participar en la DAO'
  }

  public static readonly THERE_MUST_BE_VOTING_PROCESS = {
    error: 'A voting process must have been created',
    message: 'Debe haber un proceso de votación activo'
  }

  public static readonly VOTING_PROCESS_MUST_HAVE_STARTED = {
    error: 'The current voting process hasn\'t started yet',
    message: 'El proceso de votación todavía no ha empezado'
  }

  public static readonly VOTING_PROCESS_MUST_NOT_HAVE_FINISHED = {
    error: 'The current voting process has finished',
    message: 'El proceso de votación ya ha terminado'
  }

  public static readonly REQUIRED_TOKEN_AMOUNT_MUST_BE_GREATER_THAN_0 = {
    error: 'The required token amount must be greater than 0',
    message: 'La cantidad requerida de tokens debe ser mayor a 0'
  }

  public static readonly ADDRESS_MUST_BE_A_CONTRACT = {
    error: 'managementContract must be a contract address',
    message: 'La dirección debe ser de un contrato'
  }

  public static readonly CONCURRENCY_NOT_ALLOWED = {
    error: 'Concurrency not allowed',
    message: 'Error de concurrencia, inténtalo de nuevo más tarde'
  }

  public static readonly INVALID_PROPOSAL_ID = {
    error: 'Invalid proposal id',
    message: 'Id de propuesta no válido'
  }

  public static readonly PROPOSAL_MUST_BE_PENDING = {
    error: 'Proposal must be in PENDING status',
    message: 'La propuesta debe estar PENDIENTE'
  }

  public static readonly PROPOSAL_MUST_BE_CREATED_IN_THIS_VOTING_PROCESS = {
    error: 'Proposal must have been created in current voting process',
    message: 'La propuesta debe haber sido creada en el proceso de votación activo'
  }

  public static readonly VOTES_MUST_BE_GREATER_THAN_0 = {
    error: 'Votes must be greater than 0',
    message: 'El número de votos debe ser mayor a 0'
  }

  public static readonly VOTER_DOESNT_HAVE_ENOUGH_BALANCE = {
    error: 'Voter doesn\'t have enough balance',
    message: 'No tienes suficientes tokens JJT'
  }

  public static readonly PLATFORM_DOESNT_HAVE_ENOUGH_BALANCE = {
    error: 'Platform doesn\'t have enough allowance',
    message: 'La plataforma no tiene aprobado el número suficiente de tokens'
  }

  public static readonly CALLER_MUST_BE_PROPOSER = {
    error: 'Caller must be proposal\'s proposer',
    message: 'La propuesta solo puede ser retirada por su creador'
  }

  constructor(
    private web3ManagerService: Web3managerService
  ) {
    let w3 = this.web3ManagerService.getWeb3Provider();
    this.jjdao = new w3.eth.Contract(this.ABI, this.contractAddress);
  }

  getJJDAO(){
    return this.jjdao;
  }

  getContractAddress() {
    return this.contractAddress;
  }

}
