import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { JjdaoService } from '../jjdao.service';
import { UserService } from '../user.service';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent implements OnInit, OnDestroy {

  private userSubs: Subscription;

  public user;
  public isAuthenticated;
  public isParticipant;
  public thinking = false;

  constructor(
    private router: Router,
    private userService: UserService
  ) {
    this.user = userService.getUser();
    this.isAuthenticated = userService.isAuthenticated();
    this.isParticipant = userService.isParticipant();

    this.userSubs = userService.userInfo$.subscribe((userInfo) => {
      this.thinking = false;
      this.isParticipant = userInfo.isParticipant;
      if(this.isParticipant) {
        this.router.navigate(['/propuestas']);
      }
    });
  }
  ngOnDestroy(): void {
    this.userSubs.unsubscribe();
  }

  ngOnInit() {
    if(this.isParticipant) {
      this.router.navigate(['/propuestas']);
    } else {
      this.thinking = true;
      this.userService.getParticipantInfo();
    }
  }

  participate() {
    this.thinking = true;
    this.userService.addParticipant();
    //setTimeout(() => { this.thinking = false; }, 3000);
  }

}
