#include <stdio.h>

int main() {
    int x = 5;
    int y = 7;
    int z;

    z = x + y;
    printf("The sum of %d and %d is %d\n", x, y, z);

    z = x * y + 2;
    printf("The product of %d and %d plus 2 is %d\n", x, y, z);

    if (x & y == 0) {
        printf("x and y are both zero\n");
    } else {
        printf("At least one of x and y is non-zero\n");
    }

    return 0;
}