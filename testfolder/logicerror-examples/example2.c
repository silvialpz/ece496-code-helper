#include <stdio.h>

int main() {
    int num1, num2, sum;
    
    printf("Enter the first number: ");
    scanf("%d", &num1);
    printf("Enter the second number: ");
    scanf("%d", &num2);
    
    sum = num1 - num2; 

    printf("The sum of %d and %d is %d\n", num1, num2, sum);
    
    if (num1 > num2)
        printf("%d is greater than %d\n", num1, num2);
    else
        printf("%d is greater than %d\n", num2, num1);
    
    return 0;
}