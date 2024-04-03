#include <stdio.h>

int main() {
    int x = 10;
    int y = 5;

    //1
    if (x = y) { 
        printf("x is equal to y\n");
    } else {
        printf("x is not equal to y\n");
    }

    //2
    int i = 0;
    while (i < 5) {
        printf("%d ", i);
        i--; 
    }
    printf("\n");

    //3
    int j = 5;
    while (j > 0) { 
        printf("%d ", j);
        j++;
    }
    printf("\n");

    return 0;
}
