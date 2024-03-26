#include <stdio.h>

int main(void) {
    double dailyRate;
    int numDays;
    double freeDays;
    int totalCharge;

    const double HST = 13;

    // Get the daily rate
    printf("Enter the daily rate: ");
    scanf("%d", &dailyRate);

    // Get the number of rental days
    printf("Enter the rental period (in days): ");
    scanf("%d", &numDays);

    // Compute the free  days
    freeDays = numDays / 4.0;
    printf("\nYour total free day(s) in this rental is: %d", freeDays);

    // Compute the total charge tax inclusive
    totalCharge = (1 + HST) * (numDays - freeDays) * dailyRate;
    printf("\nThe total charge including taxes is: %.2f\n", totalCharge);
    return 0;
}