import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { CarService } from '../services/car.service';
import axios from 'axios';
import { Router } from '@angular/router';
import { register } from 'swiper/element/bundle';
import { environment } from 'src/environments/environment';
register();
@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  url = environment.urlApi;
  email: any
  isLogedIn: boolean = inject(AuthService).isLoggedIn();
  router = inject(Router);
  slideOptsOne = {
    initialSlide: 0,
    slidesPerView: 1,
    autoplay: true,
  };
  dataRental: any = {
    name: '',
    seat: '',
    transmisi: '',
    jenis_bbm: '',
  };
  pickupDate: string = this.getCurrentDate();
  dropoffDate: string = this.getTomorrowDate();

  cars: any[] = []; // Array untuk menyimpan data mobil
  selectedCars: any[] = []; // Array untuk menyimpan mobil yang dipilih
  recommendedCars: any[] = []; // Array untuk menyimpan data rekomendasi

  constructor(public auth: AuthService, public carService: CarService) {}

  ngOnInit(): void {
    this.fetchCars();
  }

  isModalOpen = false;
  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }

  handleModal(item: object) {
    this.isModalOpen = !this.isModalOpen;
    this.dataRental = {
      ...item,
    };
  }

  async fetchCars() {
    try {
      const response = await this.carService.getCar();
      this.cars = response.data;

      // Pilih mobil tertentu berdasarkan nama
      const selectedCarNames = [
        'Civic',
        'Palisade',
        'Camry',
        'Ioniq 6',
        'Innova V',
        'Alphard',
      ];
      this.selectedCars = this.cars.filter((car) =>
        selectedCarNames.includes(car.name.trim())
      );

      // Pilih mobil yang direkomendasikan berdasarkan nama
      const recommendedCarNames = [
        'Fortuner',
        'Mobilio',
        'Staria',
        'Creta',
        'Veloz',
      ];
      this.recommendedCars = this.cars.filter((car) =>
        recommendedCarNames.includes(car.name.trim())
      );
    } catch (error) {
      console.error('Error fetching car data:', error);
    }
  }

  getCurrentDate() {
    return new Date().toISOString().split('T')[0];
  }

  getRentalTotalPrice() {
    const pickupDate = new Date(this.pickupDate);
    const dropoffDate = new Date(this.dropoffDate);
    const numberOfDays = Math.floor(
      (dropoffDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (this.dataRental && this.dataRental.price_per_day) {
      const totalBasePrice = numberOfDays * this.dataRental.price_per_day;
      const upfrontPaymentAmount = totalBasePrice * 0.3; // Calculate 10% payment
      return upfrontPaymentAmount;
    } else {
      return 0; // Handle potential errors (e.g., missing data)
    }
  }

  async handleBooking(item: any) {
    const bookingData = {
      rental_date: this.pickupDate || this.getCurrentDate(),
      return_date: this.dropoffDate || this.getTomorrowDate(),
      dataRental: item.name,
      customer_email: this.email,
      customer_first_name: localStorage.getItem('name'),
      data: item.Rentalname,
    };

    console.log(bookingData);

    try {
      const response = await fetch(
        'https://rental-mobil-38.my.id/api/payment',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify(bookingData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData = await response.json();
      const { token } = responseData;

      const snapScript = 'https://app.sandbox.midtrans.com/snap/snap.js';
      const clientKey = 'SB-Mid-client-2H5nKp7wB0J8eX0z';

      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = snapScript;
        script.setAttribute('data-client-key', clientKey);
        script.async = true;
        script.onload = () => {
          console.log('Snap.js loaded successfully');
          if (
            typeof window.snap !== 'undefined' &&
            typeof window.snap.pay === 'function'
          ) {
            window.snap.pay(token);
            resolve();
          } else {
            reject(
              new Error('window.snap.pay is not defined or not a function')
            );
          }
        };
        script.onerror = (error) => {
          reject(new Error('Failed to load Snap.js'));
        };
        document.body.appendChild(script);
      });
    } catch (error) {
      console.error('Error handling booking:', error);
      // Handle error appropriately
    }
  }

  getNumberOfDays() {
    const pickupDate = new Date(this.pickupDate).getTime();
    const dropoffDate = new Date(this.dropoffDate).getTime();
    const diffInDays = Math.ceil(
      (dropoffDate - pickupDate) / (1000 * 60 * 60 * 24)
    );
    return diffInDays;
  }

  getTomorrowDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  updatePickupDate(event: CustomEvent) {
    this.pickupDate = new Date(event.detail.value).toISOString().split('T')[0];
    console.log('Pickup Date updated to:', this.pickupDate);

    // Ensure you call getNumberOfDays here to recalculate after update
    this.getNumberOfDays();

    // Update the dropoffDate to ensure it's always after the pickupDate
    const newDropoffDate = new Date(this.pickupDate);
    newDropoffDate.setDate(newDropoffDate.getDate() + 1);
    this.dropoffDate = newDropoffDate.toISOString().split('T')[0];
  }

  // public alertButtons = [
  //   {
  //     text: 'No',
  //     cssClass: 'alert-button-cancel',
  //   },
  //   {
  //     text: 'Yes',
  //     cssClass: 'alert-button-confirm',
  //     handler: () => {
  //       this.logout();
  //     },
  //   },
  // ];

  // logout() {
  //   axios
  //     .get('https://localhost:8000/api/logout', {
  //       headers: {
  //         Authorization: `Bearer ${localStorage.getItem('authToken')}`,
  //       },
  //     })
  //     .then((response) => {
  //       localStorage.removeItem('authToken');
  //       this.router.navigate(['/login']);
  //     });
  // }
}
