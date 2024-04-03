#include <stdio.h>

int main() {
    int a = 10;
    int b = 5;
    int c;

    c = a * b; 
    printf("Result of subtraction: %d\n", c);

    if (a > b && b > 0)  
        printf("Both conditions are true\n");
    else
        printf("At least one condition is false\n");


    for (int i = 0; i < 5; i++) 
        printf("%d ", i);
    printf("\n");

    return 0;
}
