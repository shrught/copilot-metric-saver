// TypeScript
import axios from "axios";
import { Seat } from "../model/Seat";
import config from '../config';

import organizationMockedResponse_seats from '../assets/organization_response_sample_seats.json';
import enterpriseMockedResponse_seats from '../assets/enterprise_response_sample_seats.json';

export const getSeatsApi = async (org: string): Promise<Seat[]> => {
  const perPage = 100;
  let page = 1;
  let seatsData: Seat[] = [];
  const currentDate = new Date().toISOString().split('T')[0]; // Get the current date

  let response;
  
  if (config.scope.type !== "organization") {
    // when the scope is not organization, return seatsData,by default it will return empty array
    return seatsData;
  }
  else {
    if (config.mockedData) {
      response = organizationMockedResponse_seats;
      seatsData = seatsData.concat(response.seats.map((item: any) => {
        const seat = new Seat(item, currentDate);
        seat.last_activity_at = formatDateTime(seat.last_activity_at); // Convert to detailed time format
        return seat;
      }));
    }
    else {
      // Fetch the first page to get the total number of seats
      response = await axios.get(`${config.github.apiUrl}/orgs/${org}/copilot/billing/seats`, {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${config.github.token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
        params: {
          per_page: perPage,
          page: page
        }
      });
      
      seatsData = seatsData.concat(response.data.seats.map((item: any) => {
        const seat = new Seat(item, currentDate);
        seat.last_activity_at = formatDateTime(seat.last_activity_at); // Convert to detailed time format
        return seat;
      }));

      // Calculate the total pages
      const totalSeats = response.data.total_seats;
      const totalPages = Math.ceil(totalSeats / perPage);

      // Fetch the remaining pages
      for (page = 2; page <= totalPages; page++) {
        response = await axios.get(`${config.github.apiUrl}/orgs/${org}/copilot/billing/seats`, {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${config.github.token}`,
            "X-GitHub-Api-Version": "2022-11-28",
          },
          params: {
            per_page: perPage,
            page: page
          }
        });

        seatsData = seatsData.concat(response.data.seats.map((item: any) => {
          const seat = new Seat(item, currentDate);
          seat.last_activity_at = formatDateTime(seat.last_activity_at); // Convert to detailed time format
          return seat;
        }));
      }
    }
    return seatsData;
  }
}

// Helper function to format date and time to yyyy-mm-ddThh:mm in the current timezone
const formatDateTime = (dateTime: string): string => {
  const date = new Date(dateTime);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
