import org.web3j.abi.datatypes.*;
import org.web3j.abi.FunctionEncoder;

Function function = new Function(
    "registrar",
    List.of(
        new Address("0xEmisor"),
        new Address("0xReceptor"),
        new Uint256(1000),
        new Utf8String("Factura 0001")
    ),
    List.of()
);

String data = FunctionEncoder.encode(function);
